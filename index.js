const express = require('express');
const cors = require('cors');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 8080;

//middleware
app.use(express.json())
app.use(cors())

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ljopg.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run(){
    try{
        await client.connect()

        const billingDataCollection = client.db('powerHackData').collection('billingData');

        // create data
        app.post('/add-billing',async (req,res) => {
            const billingData = req.body;
            const result = await billingDataCollection.insertOne(billingData);
            res.send(result)
        })

        // get data
        app.get('/billing-list', async (req,res) => {
            const page = Number(req.query.page);
            const cursor = billingDataCollection.find({})
            const result = await cursor.skip(10*page).limit(10).toArray();
            const dataCount = await billingDataCollection.estimatedDocumentCount();
            res.send({message: 'success', data: result, dataCount})
        })

        //update data
        app.put('/update-billing/:id',(req,res)=>{
            const id = req.params.id
            console.log(id);
        })

        //delete data
        app.delete('/delete-billing/:id',(req,res) => {
            const id = req.params.id
            console.log(id);
        })
    }
    finally{
    }
}

run().catch(console.dir)

app.get('/', (req,res) => {
    res.send('Node Server is Running')
});

app.listen(port, () => {
    console.log('server is running at port ' + port);
})