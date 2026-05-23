require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, Db, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;
const dns = require("node:dns");
const { connect } = require("node:http2");
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
app.use(cors());
app.use(express.json());

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});


const JWKS = createRemoteJWKSet(
  new URL("http://localhost:3000/api/auth/jwks")
)
const verifyToken = async (req, res, next)=>{
  const tokenValue = req?.headers?.authorization;
  if(!tokenValue){
    return res.status(401).json({success: false, message: "Unauthorized"})
  }
  const token = tokenValue?.split(" ")[1];
  if(!token){
    return res.status(401).json({success: false, message: "Unauthorized"})
  }
  try {
    const {payload} = await jwtVerify(token, JWKS, {
    })
    
    next();
  } catch (error) {
    return res.status(401).json({success: false, message: "Unauthorized"})
  }
}
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const db = client.db("petGhor");
    const petCollections = db.collection("allPets");
    const adoptionsCollection = db.collection("adoptions");

    app.get("/all-pets", async (req, res) => {
      const species = req.query.species;
      const search = req.query.search;
      let query = {};
      if (species) {
        query.species = {
          $regex: species,
          $options: "i",
        };
      }
      if (search) {
        query.petName = {
          $regex: search,
          $options: "i",
        };
      }

      const cursor = petCollections.find(query);
      const allPets = await cursor.toArray();
      // console.log(allPets);
      res.json({
        success: true,
        message: "All pets fetched successfully",
        count: allPets.length,
        data: allPets,
      });
    });
    app.get("/all-pets/:id", verifyToken, async (req, res) => {
      const token = req?.headers?.authorization;
      // console.log(token)
      const id = req.params.id;
      // console.log(id)
      const query = {
        _id: new ObjectId(id),
      };
      const SinglePet = await petCollections.findOne(query);
      res.json({
        success: true,
        message: "Pet fetched successfully",
        data: SinglePet,
      });
    });
    app.post("/add-pet", verifyToken, async (req, res) => {
      // const db = client.db("petghor");
      const result = await petCollections.insertOne(req.body);
      // res.send(result);
      res.json({
        success: true,
        message: "Pet added successfully",
        data: result,
      });
    });
    app.get("/dashboard/my-listings", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email required" });
      }
      const totalList = await petCollections
        .find({ ownerEmail: email })
        .toArray();
      const adoptedList = await petCollections
        .find({ ownerEmail: email, status: "adopted" })
        .toArray();
      const availableList = totalList.length - adoptedList.length;
      const myPets = await petCollections.find({ ownerEmail: email }).toArray();
      res.json({
        success: true,
        data: { myPets, totalList, adoptedList, availableList },
      });
    });
    app.post("/dashboard/my-request", verifyToken, async (req, res) => {
      const { ownerEmail, petId, requesterEmail } = req.body;
      // const petId = new ObjectId(req.body.petId);
      const existing = await adoptionsCollection.findOne({
        petId,
        requesterEmail,
      });
      // console.log(req.body)
      const IsAdopted = await petCollections.findOne({
        _id: new ObjectId(petId),
        status: "adopted",
      });
      if (IsAdopted) {
        return res
          .status(400)
          .json({ success: false, message: "This pet is already adopted" });
      }
      if (ownerEmail === requesterEmail) {
        return res.status(400).json({
          success: false,
          message: "You can't request for your own pet",
        });
      }
      if (existing) {
        return res
          .status(400)
          .json({ success: false, message: "Already requested for this pet" });
      }
      const result = await adoptionsCollection.insertOne(req.body);
      res.json({ success: true, data: result });
    });
    app.get("/adoptions/pet-requests", verifyToken, async (req, res) => {
      const { petId } = req.query;
      // const Id = new ObjectId(petId);
      // console.log(petId);
      const requests = await adoptionsCollection.find({ petId }).toArray();

      res.json({ success: true, data: requests });
    });
    app.patch("/adoptions/approve", verifyToken, async (req, res) => {
      const { petId, requestId } = req.body;
      const IsRejected = await adoptionsCollection.findOne({
        _id: new ObjectId(requestId),
        status: "rejected",
      });
      if (IsRejected) {
        return res.status(400).json({
          success: false,
          message: "You can't approve a rejected request",
        });
      }
      await adoptionsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        { $set: { status: "approved" } },
      );
      await adoptionsCollection.updateMany(
        // { petId: new ObjectId(petId) },
        { petId, _id: { $ne: new ObjectId(requestId) } },
        { $set: { status: "rejected" } },
      );
      await petCollections.updateOne(
        { _id: new ObjectId(petId) },
        { $set: { status: "adopted" } },
      );
      res.json({ success: true, message: "Adoption approved" });
    });
    app.patch("/adoptions/reject", verifyToken, async (req, res) => {
      const { requestId } = req.body;
      const IsApproved = await adoptionsCollection.findOne({
        _id: new ObjectId(requestId),
        status: "approved",
      });
      if (IsApproved) {
        return res.status(400).json({
          success: false,
          message: "You can't reject an approved request",
        });
      }
      await adoptionsCollection.updateOne(
        { _id: new ObjectId(requestId) },
        { $set: { status: "rejected" } },
      );
      res.json({ success: true, message: "Adoption rejected" });
    });
    app.get("/dashboard/my-requests", verifyToken, async (req, res) => {
      const email = req.query.email;
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email required" });
      }
      const pendingList = await adoptionsCollection
        .find({ requesterEmail: email, status: "pending" })
        .toArray();
      const approvedList = await adoptionsCollection
        .find({ requesterEmail: email, status: "approved" })
        .toArray();
      const rejectedList = await adoptionsCollection
        .find({ requesterEmail: email, status: "rejected" })
        .toArray();
      const myRequests = await adoptionsCollection
        .find({ requesterEmail: email })
        .toArray();
      res.json({
        success: true,
        data: { pendingList, approvedList, rejectedList, myRequests },
      });
    });
    app.delete("/dashboard/delete-pet/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const OwnerEmail = req.body.petOwnerEmail;
      const petOwner = await petCollections.findOne({
        _id: new ObjectId(id),
        ownerEmail: OwnerEmail,
      });
      if (!petOwner) {
        return res
          .status(400)
          .json({
            success: false,
            message: "You are not the owner of this pet",
          });
      }
      await petCollections.deleteOne({ _id: new ObjectId(id) });
      await adoptionsCollection.deleteMany({ petId: id });
      res.json({ success: true, message: "Pet deleted successfully" });
    });
    app.patch("/dashboard/update-pet/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const OwnerEmail = req.body.petOwnerEmail;
      const petOwner = await petCollections.findOne({
        _id: new ObjectId(id),
        ownerEmail: OwnerEmail,
      });
      const isAdopted = await petCollections.findOne({
        _id: new ObjectId(id),
        status: "adopted",
      });
      if (isAdopted) {
        return res
          .status(400)
          .json({ success: false, message: "You can't update an adopted pet" });
      }
      if (!petOwner) {
        return res
          .status(400)
          .json({
            success: false,
            message: "You are not the owner of this pet",
          });
      }
      const updatedData = req.body;
      await petCollections.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData },
      );
      res.json({ success: true, message: "Pet updated successfully" });
    });
    app.delete("/dashboard/delete-request/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const requesterEmail = req.body.requesterEmail;
      const petRequester = await adoptionsCollection.findOne({
        _id: new ObjectId(id),
        requesterEmail,
      });
      if (!petRequester) {
        return res
          .status(400)
          .json({
            success: false,
            message: "You are not the requester of this adoption request",
          });
      }
      const request = await adoptionsCollection.deleteOne({
        _id: new ObjectId(id),
        requesterEmail,
      });
      res.json({ success: true, message: "Adoption request deleted successfully" });
    });
    app.listen(port, () => {
      console.log(`Server is running on ${port}`);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("hello world");
});
