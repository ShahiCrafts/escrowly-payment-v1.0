const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/escrowly';

  if (!process.env.MONGODB_URI) {
    logger.warn('MONGODB_URI not set, using default: mongodb://localhost:27017/escrowly');
  }

  try {
    const conn = await mongoose.connect(mongoUri);
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = connectDB;
