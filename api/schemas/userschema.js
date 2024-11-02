const mongoose = require('mongoose');

// Define the schema for the User collection
const userSchema = new mongoose.Schema({
  first_name: { type: String, required: true },
  last_name: { type: String, required: true },
  username: {type: String, required: true, unique: true},
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  location: {
    city: { type: String, required: false }, // optional fields
    country: { type: String, required: false } 
  }
});

// Create a model based on the schema
const User = mongoose.model('User', userSchema);

module.exports = User;
