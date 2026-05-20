const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 8000;

const dns = require("node:dns");
dns.setServers(["1.1.1.1", "8.8.8.8"]);

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("hello world");
});

app.listen(port, () => {
  console.log(`Server is running of ${port}`);
});