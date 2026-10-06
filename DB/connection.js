import mongoose from 'mongoose';
import logger from '../utils/logger.js';


// Serverless connection caching: cache the connect PROMISE, not its result, so concurrent
// cold-start requests all wait for the same connection instead of querying too early
// (bufferCommands is false, so a query on a still-connecting connection throws).
let connectionPromise = null;

const connectDB = async () =>
{
  if (mongoose.connection.readyState === 1 && connectionPromise)
  {
    return connectionPromise;
  }

  if (!process.env.MONGODB_URI)
  {
    logger.error('MongoDB URI not provided');
    throw new Error('MONGODB_URI environment variable not set');
  }

  if (!connectionPromise)
  {
    connectionPromise = mongoose.connect(process.env.MONGODB_URI, {
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
    })
      .then((connection) =>
      {
        logger.info(`MongoDB Connected: ${connection.connection.host}`);
        return connection;
      })
      .catch((error) =>
      {
        logger.error('MongoDB Connection Error:', error.message);
        connectionPromise = null; // allow the next request to retry
        throw new Error(`Failed to connect to MongoDB: ${error.message}`);
      });
  }

  return connectionPromise;
};

export default connectDB;
