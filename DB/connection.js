import mongoose from 'mongoose';
import { AppError } from '../utils/errorHandling.js';
import logger from '../utils/logger.js';


// Serverless connection caching
let cachedConnection = null;

const connectDB = async () =>
{
  try
  {
    if (cachedConnection && mongoose.connection.readyState === 1)
    {
      console.log('Using cached MongoDB connection');
      return cachedConnection;
    }

    if (!process.env.MONGODB_URI)
    {
      logger.error('MongoDB URI not provided');
      throw new Error('MONGODB_URI environment variable not set');
    }

    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      },
      bufferCommands: false,
      autoIndex: false,
    });

    logger.info(`MongoDB Connected: ${cachedConnection.connection.host}`);
    return cachedConnection;
  } catch (error)
  {
    logger.error('MongoDB Connection Error:', error.message);
    cachedConnection = null;
    throw new Error(`Failed to connect to MongoDB: ${error.message}`);
  }
};

export default connectDB;