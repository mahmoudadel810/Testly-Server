import mongoose from "mongoose";
import logger from '../utils/logger.js';

const connectionDB = async () =>
{
  try
  {
    // Debug: Log the actual URI being used
    console.log('Raw MONGODB_URI:', JSON.stringify(process.env.MONGODB_URI));
    console.log('URI length:', process.env.MONGODB_URI?.length);

    const options = {
      serverSelectionTimeoutMS: 30000, // Increase timeout
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverApi: {
        version: '1',
        strict: true,
        deprecationErrors: true,
      }
    };
    logger.info('Attempting to connect to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, options);
    logger.info("DB Connected successfully!");

    // ... rest of your code
  } catch (err)
  {
    logger.error("DB Connection Failed!", {
      error: err.message,
      code: err.code,
      name: err.name,
      rawUri: process.env.MONGODB_URI ? 'URI exists' : 'URI missing'
    });

    if (process.env.NODE_ENV === 'production')
    {
      logger.info('Retrying connection in 5 seconds...');
      setTimeout(connectionDB, 5000);
    }
  }
};
export default connectionDB;
// mongoose.set("strictQuery", true);  