const express = require('express');
const mongoose = require('mongoose')
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');
const User = require('./schemas/userschema')

const app = express();

app.use(express.json());
app.use(cors());
app.use(bodyParser.json());

// connect to db
const connectDB = require('./database');

// setting config.env as .env file
dotenv.config({ path: 'config.env'});
const PORT = process.env.PORT || 8080

// connect to mongodb
connectDB();

app.post('/api/signup', async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            username,
            email,
            password,
            dateOfBirth,
        } = req.body;

        const existingUser = await User.findOne({ email: email});
        if (existingUser) { 
            return res.status(400).json({ error: 'Email is already in use'});
        }

        const newUser = new User({
            first_name: firstName,
            last_name: lastName,
            username: username,
            email: email,
            password: password,
            dob: new Date(dateOfBirth),
        });

        await newUser.save();

        res.status(201).json({ message: 'User created successfully'});
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({error: 'Internal server error'});
    }
});
    


app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
})
