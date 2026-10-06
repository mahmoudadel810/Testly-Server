import express from "express";
import { json } from "express";
import dbConnect from './DB/connection.js'; // Renamed for clarity
import cors from "cors";
import * as AllRouters from "./modules/indexRouters.js";
import swaggerDocs from './utils/swagger.js';
import morgan from 'morgan';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler, notFound } from './utils/errorHandling.js';
import { config } from 'dotenv';
import path from 'path';
import redisManager from './utils/redis.js';
import createRateLimiter from './utils/rateLimitRedis.js';
import logger from './utils/logger.js';

config({ path: path.resolve('config/.env') });

//==============================================================
const port = process.env.PORT || 3000;
const app = express();
// Behind Vercel's proxy: use X-Forwarded-For so rate limiting keys on the real client IP
app.set('trust proxy', 1);
const BASE_URL = process.env.BASE_URL || 'api';

//=============================================================
// Initialize Redis connection
const initializeRedis = async () =>
{
  try
  {
    await redisManager.connect();
    logger.info('Redis initialization completed');
  } catch (error)
  {
    logger.error('Redis initialization failed', { error: error.message });
  }
};

// Create Redis-based rate limiter 
const limiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP/user to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  keyPrefix: 'api_rate_limit:'
});

//=============================================================
// CORS first, so even a failed service initialisation returns a readable error to the browser
app.use(cors());

//=============================================================
// Vercel serverless connection handling
// Track if services are initialized
let servicesInitialized = false;

// Add middleware to ensure DB/Redis are connected before handling requests
// This is crucial for serverless environments where the server may cold start frequently
app.use(async (req, res, next) =>
{
  try
  {
    // Skip if already initialized or not running on Vercel (locally startServer() connects)
    if (servicesInitialized || !process.env.VERCEL)
    {
      return next();
    }

    // Initialize services on first request
    logger.info('First request detected in Vercel environment, initializing services');
    await dbConnect();
    await initializeRedis();
    servicesInitialized = true;
    next();
  } catch (error)
  {
    logger.error('Failed to initialize services in middleware', { error: error.message });
    next(error); // Let error handler deal with it
  }
});

//=============================================================
app.use(json());
app.use(compression());
app.use(helmet());
app.use(morgan('dev'));
app.use(limiter.middleware());

//=============================================================
// Test routes
app.get('/', (req, res) =>
{
  res.json({ message: 'Your Testly Server is running' });
});

// Health check endpoint
app.get('/health', async (req, res) =>
{
  try
  {
    const { checkSystemHealth } = await import('./utils/healthCheck.js');
    const healthStatus = await checkSystemHealth();
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error)
  {
    logger.error('Health check failed', { error: error.message });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Main Routers  
app.use(`/${BASE_URL}/admin`, AllRouters.adminRouter);
app.use(`/${BASE_URL}/auth`, AllRouters.authRouter);
app.use(`/${BASE_URL}/exam`, AllRouters.examRouter);
app.use(`/${BASE_URL}/attempt`, AllRouters.attemptRouter);
app.use(`/${BASE_URL}/contact`, AllRouters.contactRouter);

// Swagger documentation
swaggerDocs(app, BASE_URL);

// Error handling
app.use(notFound);
app.use(errorHandler);

//====================== SERVER STARTUP =======================================
const startServer = async () =>
{
  try
  {
    // Initialize database and Redis
    await dbConnect(); // Use the new connection handler
    await initializeRedis();
    servicesInitialized = true;

    // Start server
    const server = app.listen(port, () =>
    {
      console.log(`Server running on port ${port}`);
      logger.info('Server started', { port, baseUrl: BASE_URL });
      console.log(`Swagger: http://localhost:${port}/${BASE_URL}/docs`);
    });

    // Graceful shutdown 
    const shutdown = async () =>
    {
      logger.info('Shutting down gracefully');
      await redisManager.disconnect();
      server.close(() =>
      {
        logger.info('Server closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    return server;
  } catch (error)
  {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Vercel requires this export
const vercelHandler = app;

// Start a listening server everywhere except on Vercel (production and preview are serverless)
if (!process.env.VERCEL)
{
  startServer();
}

export default vercelHandler;