// saleschema.js

const mongoose = require('mongoose');

const restroomSchema = new mongoose.Schema({
  location: {
    city: { type: String, required: true },
    country: { type: String, required: true },
  },
  coverPhoto: { type: String, required: true },
  description: { type: String },
  itemImages: [{ type: String }], // An array of strings for image URLs
  additionalInfo: { type: String },
  posterID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

const Restroom = mongoose.model('Restroom', restroomSchema);

module.exports = Restroom;