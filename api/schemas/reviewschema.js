const mongoose = require('mongoose');

// Define the schema for the User collection
const reviewSchema = new mongoose.Schema({
  cleanliness: { type: Number, required: true },
  amenities: { type: Number, required: true },
  accessibility: { type: Number, required: true, unique: true },
  overall_quality: { type: Number, required: true },
  review: { type: String, required: true },
  reviewerID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date_posted: { type: Date, required: true }
});

// Create a model based on the schema
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
