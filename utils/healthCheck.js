import mongoose from 'mongoose';
import redisManager from './redis.js';
import logger from './logger.js';

/**
 * Performs a health check on the database connection
 * @returns {Promise<Object>} Health status of the database
 */
export const checkDatabaseHealth = async () =>
{
    try
    {
        const status = mongoose.connection.readyState;
        const statusMap = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        // If connected, perform a simple ping operation
        let latency = null;
        if (status === 1)
        {
            const start = Date.now();
            // Simple ping-like operation
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
        // Use the built-in health check method from RedisManager
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
 * Comprehensive health check for all services
 * @returns {Promise<Object>} Health status of all services
 */
export const checkSystemHealth = async () =>
{
    const [dbHealth, redisHealth] = await Promise.all([
        checkDatabaseHealth(),
        redisManager.healthCheck()
    ]);

    // logger.info('Health Check - DB Status:', dbHealth.status);
    // logger.info('Health Check - Redis Status:', redisHealth.status);

    const isHealthy = dbHealth.status === 'connected' &&
        (redisHealth.status === 'healthy' || redisHealth.status === 'disconnected');

    logger.info('Health Check - isHealthy calculated as:', isHealthy);

    return {
        status: isHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
            database: dbHealth,
            redis: redisHealth,
            server: { status: 'running' }
        }
    };
};

export default {
    checkDatabaseHealth,
    checkRedisHealth,
    checkSystemHealth
}; 