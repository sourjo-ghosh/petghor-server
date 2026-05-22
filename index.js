require("dotenv").config(); 
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, Db, ObjectId } = require("mongodb");
const uri = process.env.MONGODB_URI;
const dns = require("node:dns");
const { connect } = require("node:http2");
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
    app.get("/all-pets/:id", async (req, res) => {
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
    app.post("/add-pet", async (req, res) => {
      // const db = client.db("petghor");
      const result = await petCollections.insertOne(req.body);
      // res.send(result);
      res.json({
        success: true,
        message: "Pet added successfully",
        data: result,
      });
    });
    app.get("/dashboard/my-listings", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      if (!email) {
        return res
          .status(400)
          .json({ success: false, message: "Email required" });
      }

      const myPets = await petCollections.find({ ownerEmail: email }).toArray();

      res.json({
        success: true,
        data: myPets,
      });
    });
    app.post("/dashboard/my-request", async (req, res) => {

      const { ownerEmail, petId, requesterEmail } = req.body;
      // const petId = new ObjectId(req.body.petId);
      const existing = await adoptionsCollection.findOne({
        petId,
        requesterEmail,
      });
      // console.log(req.body)
      if (ownerEmail === requesterEmail) {
        return res
          .status(400)
          .json({
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
    app.get("/adoptions/pet-requests", async (req, res) => {
      const { petId } = req.query;
      // const Id = new ObjectId(petId);
      console.log(petId)
      const requests = await adoptionsCollection.find({ petId }).toArray();

      res.json({ success: true, data: requests });
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
