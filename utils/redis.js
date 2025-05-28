import Redis from 'ioredis';
import logger from './logger.js';

class RedisManager
{
    constructor()
    {
        this.client = null;
        this.isConnected = false;
        this.connectionAttempted = false;
    }

    /**
     * Connect to Redis - This is called when the app starts
     */
    async connect()
    {
        try
        {
            // Don't try to connect multiple times
            if (this.connectionAttempted)
            {
                return;
            }
            this.connectionAttempted = true;

            logger.info('Attempting to connect to Redis...', {
                host: process.env.REDIS_HOST,
                url: process.env.REDIS_URL ? 'URL provided' : 'No URL provided'
            });

            if (!process.env.REDIS_URL)
            {
                logger.warn('No REDIS_URL provided, skipping Redis connection');
                return;
            }

            this.client = new Redis(process.env.REDIS_URL, {
                tls: {
                    // Required for Upstash TLS verification
                    servername: process.env.REDIS_HOST,
                    rejectUnauthorized: true
                },
                socket: {
                    keepAlive: 5000, // Prevent ECONNRESET
                    tls: true, // Explicit TLS declaration
                    reconnectStrategy: (retries) =>
                    {
                        if (retries > 3)
                        {
                            logger.error('Redis max retries reached, giving up after 3 retries');
                            return null; // Stop retrying
                        }
                        return Math.min(retries * 1000, 3000); // Exponential backoff
                    }
                },
                connectTimeout: 10000,
                commandTimeout: 5000,
                maxRetriesPerRequest: 1,
                // Don't retry forever - fail fast
                lazyConnect: true,
                retryDelayOnFailover: 1000
            });

            // When Redis is ready to use
            this.client.on('ready', () =>
            {
                logger.info('Redis connected and ready to use');
                this.isConnected = true;
            });

            // When connection breaks
            this.client.on('error', (err) =>
            {
                logger.error('Redis connection error:', err.message);
                this.isConnected = false;

                // Don't try to reconnect endlessly
                if (err.code === 'ECONNRESET')
                {
                    logger.warn('Connection reset - will try to reconnect...');
                }
            });

            // When connection closes
            this.client.on('close', () =>
            {
                logger.warn('Redis connection closed');
                this.isConnected = false;
            });

            // Actually connect now
            await this.client.connect();
            await this.client.ping();

            logger.info('Redis connection test successful');

        } catch (error)
        {
            logger.error('Failed to connect to Redis:', {
                message: error.message,
                code: error.code
            });

            // Set to false so app continues without Redis
            this.isConnected = false;
            this.client = null;

            // DON'T throw error - let app continue without Redis
            logger.warn('App will continue without Redis caching');
        }
    }

    /**
     * Check if Redis is ready to use
     * This is what other files call to check before using Redis
     */
    isReady()
    {
        return this.isConnected &&
            this.client !== null &&
            this.client.status === 'ready';
    }

    /**
     * Get the Redis client to actually use
     * This is what other files call to get the Redis client
     */
    getClient()
    {
        // Safety check - return null if not ready
        if (!this.isReady())
        {
            return null;
        }
        return this.client;
    }

    /**
     * Safely disconnect from Redis
     */
    async disconnect()
    {
        if (this.client)
        {
            try
            {
                await this.client.quit();
                logger.info('Redis disconnected gracefully');
            } catch (error)
            {
                logger.error('Error disconnecting from Redis:', error.message);
            }
        }
        this.client = null;
        this.isConnected = false;
    }

    /**
     * Health check for monitoring
     */
    async healthCheck()
    {
        if (!this.isReady())
        {
            return {
                status: 'disconnected',
                message: 'Redis is not connected'
            };
        }

        try
        {
            const start = Date.now();
            await this.client.ping();
            const latency = Date.now() - start;

            return {
                status: 'healthy',
                latency: `${latency}ms`,
                message: 'Redis is working properly'
            };
        } catch (error)
        {
            return {
                status: 'error',
                message: error.message
            };
        }
    }

    async get(key, fallbackFn)
    {
        try
        {
            const cached = await this.getFromRedis(key);
            if (cached) return cached;
            return fallbackFn(); // Fetch from DB if cache misses
        } catch (error)
        {
            logger.error('Cache failed, falling back to DB', error);
            return fallbackFn();
        }
    }
}

// Create ONE instance that the whole app uses
const redisManager = new RedisManager();

export default redisManager;