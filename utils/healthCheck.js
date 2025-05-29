import mongoose from 'mongoose';
import redisManager from './redis.js';
import logger from './logger.js';

const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
};

/**
 * Performs a health check on the database connection
 * @returns {Promise<Object>} Health status of the database
 */
export const checkDatabaseHealth = async () =>
{
    try
    {
        const status = mongoose.connection.readyState;
        let latency = null;

        if (status === 1)
        {
            const start = Date.now();
            await mongoose.connection.db.admin().ping();
            latency = `${Date.now() - start}ms`;
        }

        return {
            status: statusMap[status] || 'unknown',
            latency,
            message: status === 1 ? 'Database is healthy' : `Database status: ${statusMap[status]}`
        };
    } catch (error)
    {
        logger.error('Database health check failed', { error: error.message });
        return {
            status: 'error',
            message: error.message
        };
    }
};

/**
 * Performs a health check on the Redis connection
 * @returns {Promise<Object>} Health status of Redis
 */
export const checkRedisHealth = async () =>
{
    try
    {
        return await redisManager.healthCheck();
    } catch (error)
    {
        logger.error('Redis health check failed', { error: error.message });
        return {
            status: 'error',
            message: error.message
        };
    }
};

/**
 * Check environment and Vercel-specific configuration
 */
export const checkEnvironmentConfig = () =>
{
    const requiredVars = [
        'MONGODB_URI',
        'REDIS_URL',
        'REDIS_HOST',
        'SIGNATURE'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    return {
        status: missingVars.length === 0 ? 'complete' : 'incomplete',
        environment: process.env.NODE_ENV || 'not set',
        vercel: {
            isVercel: !!process.env.VERCEL,
            vercelEnv: process.env.VERCEL_ENV || 'not set'
        },
        missingVars: missingVars.length > 0 ? missingVars : [],
        message: missingVars.length === 0
            ? 'All required environment variables are set'
            : `Missing environment variables: ${missingVars.join(', ')}`
    };
};

/**
 * Comprehensive health check for all services
 * @returns {Promise<Object>} Health status of all services
 */
export const checkSystemHealth = async () =>
{
    const [dbHealth, redisHealth] = await Promise.all([
        checkDatabaseHealth(),
        redisManager.healthCheck()
    ]);

    const envConfig = checkEnvironmentConfig();

    const isHealthy = dbHealth.status === 'connected' &&
        (redisHealth.status === 'healthy' || redisHealth.status === 'disconnected') &&
        envConfig.status === 'complete';

    logger.info('Health Check - isHealthy calculated as:', isHealthy);

    return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
            database: dbHealth,
            redis: redisHealth,
            environment: envConfig,
            server: {
                status: 'running',
                uptime: `${process.uptime()}s`,
                memory: process.memoryUsage()
            }
        }
    };
};

export default {
    checkDatabaseHealth,
    checkRedisHealth,
    checkEnvironmentConfig,
    checkSystemHealth
};