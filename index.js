require("dotenv").config(); // ← সবার আগে এই line
const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 8000;
const { MongoClient, ServerApiVersion, Db } = require("mongodb");
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
    app.get("/all-pets", async (req, res) => {
      const cursor = petCollections.find();
      const allPets = await cursor.toArray();
      console.log(allPets)
      res.json({
        success: true,
        message: "All pets fetched successfully",
        count: allPets.length,
        data: allPets,
      });
    });

    app.listen(port, () => {
      console.log(`Server is running of ${port} ${uri}`);
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
