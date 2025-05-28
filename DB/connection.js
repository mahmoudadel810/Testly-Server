import mongoose from "mongoose";
import logger from '../utils/logger.js';

const connectionDB = async () =>
{
  try
  {
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    };

    logger.info('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    logger.info("DB Connected successfully!");

    // Log connection state changes
    mongoose.connection.on('disconnected', () =>
    {
      logger.error('MongoDB disconnected');
    });

    mongoose.connection.on('error', (err) =>
    {
      logger.error('MongoDB connection error:', err);
    });

  } catch (err)
  {
    logger.error("DB Connection Failed!", {
      error: err.message,
      code: err.code,
      name: err.name,
      stack: err.stack
    });
    // In production, we might want to retry the connection
    if (process.env.NODE_ENV === 'production')
    {
      logger.info('Retrying connection in 5 seconds...');
      setTimeout(connectionDB, 5000);
    }
  }
};
export default connectionDB;
// mongoose.set("strictQuery", true);  