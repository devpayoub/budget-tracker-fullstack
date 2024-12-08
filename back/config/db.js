const mongoose = require('mongoose');
const config = require('config');

const connectDB = async () => {
  try {
    const db = process.env.MONGODB_URL || config.get('mongodbURL');
    if (!db) {
      throw new Error('MongoDB URI is not defined.');
    }
    await mongoose.connect(db);
    console.log('MongoDB connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
