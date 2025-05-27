import express from "express";
import { json } from "express";
import connectionDB from './DB/connection.js';
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
    // Application continues without Redis
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

connectionDB();
app.use(cors()); // Enables Cross-Origin Resource Sharing
app.use(json());
app.use(compression()); // Compresses response bodies
app.use(helmet()); // Secures the app by setting various HTTP headers
app.use(morgan('dev'));
app.use(limiter.middleware()); // Redis-based rate limiting

//=============================================================

// Test routes
app.get('/', (req, res) =>
{
  res.json({ message: 'Express server is working' });
});

// Health check endpoint
app.get('/health', async (req, res) =>
{
  try
  {
    const { checkSystemHealth } = await import('./utils/healthCheck.js');
    const healthStatus = await checkSystemHealth();

    // Return 200 if healthy, 503 if degraded
    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  }
  catch (error)
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
console.log(BASE_URL);

//call al swagger   
swaggerDocs(app, BASE_URL);

// Error handling middleware, after all routes to detect their all errors
app.use(notFound);
app.use(errorHandler);

//======================RUN SERVER =======================================

const startServer = async () =>
{
  try
  {
    await initializeRedis();

    // Only start server and add signal handlers in local/dev
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL)
    {
      app.listen(port, () =>
      {
        console.log(`server is running on port ${port}`);
        logger.info('Server started successfully', { port, baseUrl: BASE_URL });
        console.log(`Swagger documentation available at: http://localhost:${port}/${BASE_URL}/docs`);
      });

      process.on('SIGTERM', async () =>
      {
        logger.info('SIGTERM received, shutting down gracefully');
        await redisManager.disconnect();
        process.exit(0);
      });

      process.on('SIGINT', async () =>
      {
        logger.info('SIGINT received, shutting down gracefully');
        await redisManager.disconnect();
        process.exit(0);
      });
    }
  } catch (error)
  {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

// Only call startServer in local/dev
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL)
{
  startServer();
}

// For Vercel: export the app
export default app;
