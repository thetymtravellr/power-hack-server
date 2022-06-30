const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
require("dotenv").config();

const app = express();
const port = process.env.PORT || 8080;

//middleware
app.use(express.json());
app.use(cors());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ljopg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();

    const billingDataCollection = client
      .db("powerHackData")
      .collection("billingData");

    // create data
    app.post("/add-billing", async (req, res) => {
      const billingData = req.body;
      const result = await billingDataCollection.insertOne(billingData);
      if (result.acknowledged) {
        res.status(200).send({ message: "successfully added" });
      } else {
        res.status(400).send({ message: "Something went wrong" });
      }
    });

    // get data
    app.get("/billing-list", async (req, res) => {
      const page = Number(req.query.page);
      const cursor = billingDataCollection.find({}).sort({ _id: -1 });
      const result = await cursor
        .skip(10 * page)
        .limit(10)
        .toArray();
      const dataCount = await billingDataCollection.estimatedDocumentCount();
      res.send({ message: "success", data: result, dataCount });
    });

    //update data
    app.put("/update-billing/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const { fullname, email, phone, amount } = req.body;
      const updateData = {
        $set: {
          fullname,
          email,
          phone,
          amount,
        },
      };
      const result = await billingDataCollection.updateOne(
        filter,
        updateData,
        options
      );
      res.send(result);
    });

    //delete data
    app.delete("/delete-billing/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await billingDataCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Node Server is Running");
});

app.listen(port, () => {
  console.log("server is running at port " + port);
});
