import mongoose from 'mongoose';
import redisManager from './redis.js';
import logger from './logger.js';

const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
};

const handleHealthError = (error, service) =>
{
    logger.error(`${service} health check failed`, { error: error.message });
    return { status: 'error', message: error.message };
};

export const checkDatabaseHealth = async () =>
{
    try
    {
        const status = mongoose.connection.readyState;
        const latency = status === 1 ? await measureLatency() : null;

        return {
            status: statusMap[status] || 'unknown',
            latency,
            message: status === 1 ? 'Database is healthy' : `Database status: ${statusMap[status]}`
        };
    }
    catch (error)
    {
        return handleHealthError(error, 'Database');
    }
};


export const checkRedisHealth = async () =>
{
    try
    {
        return await redisManager.healthCheck();
    } catch (error)
    {
        return handleHealthError(error, 'Redis');
    }
};

/**
 * Check environment and Vercel-specific configuration
 */
export const checkEnvironmentConfig = () =>
{
    const requiredVars = [
        'MONGODB_URI',
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

const measureLatency = async () => //ping the database to measure latency
{
    const start = Date.now();
    await mongoose.connection.db.admin().ping();
    return `${Date.now() - start}ms`;
};

/**
 * Comprehensive health check for all services
 * @returns {Promise<Object>} Health status of all services
 */
export const checkSystemHealth = async () =>
{
    try
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
                    memory: process.memoryUsage(),
                    baseUrl: process.env.BASE_URL || 'api'
                }
            }
        };
    }
    catch (error) 
    {
        return handleHealthError(error, 'System');
    }
};

export default {
    checkDatabaseHealth,
    checkRedisHealth,
    checkEnvironmentConfig,
    checkSystemHealth
};