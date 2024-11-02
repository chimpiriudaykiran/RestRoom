
const mongoose = require('mongoose');
const User = require('./schemas/userschema');
const Restroom = require('./schemas/restroomschema');

const connectDB = async () => {
  try {
    // Connect to MongoDB
    const con = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB connected: ${con.connection.host}`);

    /* Example: Insert a user
    const newUserWithLocation = new User({
      first_name: 'Johnny',
      last_name: 'Bravo',
      dob: new Date('1985-05-15'),
      email: 'heresjohnny@test.com',
      password: 'hashed_password_here',
    });

    // Save the user using promises
    await newUserWithLocation.save();
    console.log('User inserted successfully');

    // Example: Insert a garage sale
    const newGarageSale = new GarageSale({
      location: {
        city: 'New City',
        country: 'Old Country',
      },
      coverPhoto: 'example_cover_photo_url.jpg',
      description: 'Example garage sale description',
      itemImages: ['item1_image_url.jpg', 'item2_image_url.jpg'],
      startDate: new Date('2023-01-01'),
      endDate: new Date('2023-01-02'),
      endTime: '18:01',
      additionalInfo: 'Additional information about the garage sale',
      sellerID: newUserWithLocation._id, // Assuming you want to link the garage sale to the user
    });

    // Save the garage sale using promises
    await newGarageSale.save();
    console.log('Garage sale inserted successfully');
    */
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

module.exports = connectDB;
