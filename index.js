const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const admin = require("firebase-admin");
const port = process.env.PORT || 5000;
// firebase admin
const serviceAccount = require('./doctor-portal-cs-firebase-admin.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// middlewears
app.use(cors());
app.use(express.json());
// verify token middlewear
async function verifyToken  (req, res, next) {
	if(req?.headers?.authorization?.startsWith('Bearer ')) {
		const idToken = req.headers.authorization.split('Bearer ')[1];
		try {
			const decodedIdToken = await admin.auth().verifyIdToken(idToken);
			req.decodedEmail = decodedIdToken.email;
			next();
		} catch (error) {
			res.status(401).send('Unauthorized');
		}
	}

}
// mongo db
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env
	.DB_PASS}@firstcluster.fhu8f.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
async function connectToDatabase() {
	try {
		await client.connect();
		const database = client.db('doctorsPortal');
		const appointmentsCollection = database.collection('appoinments');
		const usersCollection = database.collection('users');
		// get all appointments
		app.get('/appointments', async (req, res) => {
			const email = req.query.email;
			// console.log(new Date(req.query.date).toLocaleDateString());
			const date = new Date(req.query.date).toLocaleDateString('en-US', { timeZone: 'UTC' });
			// console.log(date);
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
		// save user data
		app.post('/users', async (req, res) => {
			try {
				const user = req.body;
				const result = await usersCollection.insertOne(user);
				res.json(result);
			} catch (error) {
				res.status(500).send(error);
			}
		});
		// update user data
		app.put('/users', async (req, res) => {
			try {
				const user = req.body;
				const filter = { email: user.email };
				const options = { upsert: true };
				const updateDoc = { $set: user };
				const result = await usersCollection.updateOne(filter, updateDoc, options);
				res.json(result);
			} catch (error) {
				res.status(500).send(error);
			}
		});
		// add an admin to db
		app.put('/users/admin',verifyToken, async (req, res) => {
			const requester = req.decodedEmail
			if(requester){
				const requesterData = await usersCollection.findOne({email: requester})
				if(requesterData.isAdmin){
	const user = req.body;
			const filter = { email: user.email };
			const updateDoc = { $set: { isAdmin: true } };
			const result = await usersCollection.updateOne(filter, updateDoc);
			res.json(result);
				}
			}else{
				res.status(403).json({message: "You do not have acccess to it"})
			}
		
		});
		// confirm an admin
		app.get('/users/:email', async (req, res) => {
			const email =  req.params.email;
			if(email == 'undefined') return
			console.log('Email',email);
			const query = { email: email };
			const user = await usersCollection.findOne(query);
			console.log('user',user);
			if (user?.isAdmin) {
				user.isAdmin = true;
				res.json(user);
			} else {
				user.isAdmin = false;
				res.json(user);
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
