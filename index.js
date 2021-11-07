const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 5000;
// middlewear
app.use(cors());
app.use(express.json());
// mongo db
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env
	.DB_PASS}@firstcluster.fhu8f.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function connectToDatabase() {
	try {
		await client.connect();

		const database = client.db('doctorPortal');
		const serviceCollection = database.collection('service');
		console.log('Connected to database');
	} finally {
		// Ensures that the client will close when you finish/error
		// await client.close();
	}
}
connectToDatabase().catch(console.dir);

// routes
app.get('/', (req, res) => {
	res.send('server is up');
});

app.listen(port, () => {
	console.log(`server is up on port ${port}`);
});
