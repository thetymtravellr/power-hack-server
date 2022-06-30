const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
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

function verifyToken(token) {
  let email;

  jwt.verify(token, process.env.TOKEN_SECRET, function (err, decoded) {
    if (err) {
      email = "Invalid email";
    }
    if (decoded) {
      email = decoded;
    }
  });
  return email;
}

async function run() {
  try {
    await client.connect();

    const billingDataCollection = client
      .db("powerHackData")
      .collection("billingData");

    const usersCollection = client.db("powerHackData").collection("users");

    //create user
    app.post("/registration", async (req, res) => {
      const { fullname, email, password } = req.body;
      const findUser = await usersCollection.findOne({ email });
      if (!findUser) {
        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(password, salt);
        const user = {
          fullname,
          email,
          password: hashedPassword,
        };
        const result = await usersCollection.insertOne(user);
        if (result.acknowledged) {
          const token = jwt.sign(email, process.env.TOKEN_SECRET);
          res.status(200).send({ message: "success", token });
        } else {
          res.status(500).send({ message: "Something went wrong" });
        }
      } else {
        res.status(400).send({ message: "User already exist" });
      }
    });

    //get users
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;
      const filter = { email: email };
      const user = await usersCollection.findOne(filter);

      if (!user) {
        return res.status(400).send({ message: "no user found" });
      }
      try {
        const matched = await bcrypt.compare(password, user.password);
        if (matched) {
          const token = jwt.sign(email, process.env.TOKEN_SECRET);
          res.status(200).send({ message: "success", token, email });
        } else {
          res.status(403).send({ message: "forbidden" });
        }
      } catch {
        res.status(500).send({ message: "invalid password" });
      }
    });

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
      const email = req.query.email;
      const tokenInfo = req.headers.authorization;
      const decoded = verifyToken(tokenInfo);

      if (decoded === email) {
        const page = Number(req.query.page);
        if (req.query.q) {
          const cursor = billingDataCollection.find({
            $text: { $search: req.query.q },
          });
          const calculateAmountArray = await billingDataCollection
            .find({ addedBy: email })
            .toArray();
          const result = await cursor
            .skip(10 * page)
            .limit(10)
            .toArray();
          const dataCount =
            await billingDataCollection.estimatedDocumentCount();
          res.status(200).send({
            message: "success",
            data: result,
            dataCount,
            calculateAmountArray,
          });
        } else {
          const query = { addedBy: email };
          const cursor = billingDataCollection.find(query).sort({ _id: -1 });
          const calculateAmountArray = await billingDataCollection
            .find({ addedBy: email })
            .toArray();
          const result = await cursor
            .skip(10 * page)
            .limit(10)
            .toArray();
          const dataCount =
            await billingDataCollection.estimatedDocumentCount();
          res.status(200).send({
            message: "success",
            data: result,
            dataCount,
            calculateAmountArray,
          });
        }
      } else {
        res.status(403).send({ message: "unauthorized access" });
      }
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
