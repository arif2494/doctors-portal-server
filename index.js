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
		const database = client.db('doctorsPortal');
		const appointmentsCollection = database.collection('appoinments');
		// get all appointments
		app.get('/appointments', async (req, res) => {
			const email = req.query.email;
			console.log(new Date(req.query.date).toLocaleDateString());
			const date = new Date(req.query.date).toLocaleDateString();
			console.log(date);
			const query = { patientEmail: email, date: date };
			const cursor = appointmentsCollection.find(query);
			const appointments = await cursor.toArray();
			res.json(appointments);
		});
		// create a new appointment
		app.post('/appointments', async (req, res) => {
			try {
				const appointment = req.body;
				const result = await appointmentsCollection.insertOne(appointment);
				res.json(result);
			} catch (error) {
				res.status(500).send(error);
			}
		});
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
