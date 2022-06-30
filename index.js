const express = require('express');
const cors = require('cors');
require('dotenv').config()

const app = express()
const port = process.env.PORT || 8080;

//middleware
app.use(express.json())
app.use(cors())

app.get('/', (req,res) => {
    res.send('Node Server is Running')
});

app.listen(port, () => {
    console.log('server is running at port ' + port);
})