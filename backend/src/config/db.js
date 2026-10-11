const mongoose = require('mongoose');
const { ensureSeeded } = require('../seed/autoSeed');

let isConnected = false;

const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/inox_factory_db';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed if database is brand new (e.g. freshly connected MongoDB Atlas)
    try {
      await ensureSeeded();
    } catch (seedErr) {
      console.warn('Auto-seed check note:', seedErr.message);
    }

    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV !== 'production') {
      // In local development, fail fast if local db is down
    }
    throw error;
  }
};

module.exports = connectDB;
