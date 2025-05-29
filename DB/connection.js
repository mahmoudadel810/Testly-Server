import mongoose from 'mongoose';
import { AppError } from '../utils/errorHandling.js';


// Serverless connection caching
let cachedConnection = null;

async function connectDB()
{
  if (cachedConnection)
  {
    return cachedConnection;
  }

  // Validate environment variable
  if (!process.env.MONGODB_URI)
  {
    throw new AppError("MONGODB_URI environment variable not set");
  }

  try
  {
    // Connection options optimized for Vercel
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Fail fast if no primary available
      maxPoolSize: 10, // For serverless connection pooling
      socketTimeoutMS: 45000, // Close sockets after 45s inactivity
    };

    // Establish connection
    const connection = await mongoose.connect(process.env.MONGODB_URI, options);

    console.log(`MongoDB Connected: ${connection.connection.host}`);
    cachedConnection = connection;
    return connection;
  } catch (error)
  {
    console.error(`DB Connection Error: ${error.message}`);
    // Rethrow to prevent server from starting without DB
    throw error;
  }
}

export default connectDB;