import mongoose from 'mongoose';
import { AppError } from '../utils/errorHandling.js';


// Serverless connection caching
let cachedConnection = null;

async function connectDB()
{
  // Check if we already have a connection and it's still valid
  if (cachedConnection && mongoose.connection.readyState === 1)
  {
    console.log('Using cached MongoDB connection');
    return cachedConnection;
  }

  // Validate environment variable
  if (!process.env.MONGODB_URI)
  {
    throw new AppError("MONGODB_URI environment variable not set");
  }

  try
  {
    // Connection options optimized for Vercel serverless
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Fail fast if no primary available
      maxPoolSize: 10, // For serverless connection pooling
      socketTimeoutMS: 45000, // Close sockets after 45s inactivity
      serverApi: {
        version: '1', // Explicitly set API version
        strict: true,
        deprecationErrors: true,
      },
      // Key settings for serverless environments
      bufferCommands: false, // Don't buffer commands when disconnected
      autoIndex: false, // Don't build indexes automatically in production
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