import redisManager from './redis.js';
import logger from './logger.js';
import { AppError } from './errorHandling.js';

class RedisRateLimiter
{
    constructor(options = {})
    {
        //i will change this later after testing 
        this.windowMs = options.windowMs || 3 * 60 * 1000; // 3 minutes
        this.maxRequests = options.max || 500;
        this.keyPrefix = options.keyPrefix || 'rate_limit:';
        this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
        this.skipFailedRequests = options.skipFailedRequests || false;
        this.message = options.message || 'Too many requests from this IP, please try again later';
    }

    // Generate key for IP address
    generateKey(identifier)
    {
        return `${this.keyPrefix}${identifier}`;
    }

    // Get client identifier (IP address or user ID)
    getIdentifier(req)
    {
        // Prefer user ID if authenticated, otherwise use IP
        if (req.user && req.user._id)
        {
            return `user:${req.user._id}`;
        }

        // Get IP from various headers (for reverse proxies)
        return req.ip ||
            req.connection.remoteAddress ||
            (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].split(',')[0]) ||
            req.socket.remoteAddress ||
            'unknown';
    }

    // Main rate limiting middleware
    middleware()
    {
        return async (req, res, next) =>
        {
            // Skip if Redis is not available - fallback to no rate limiting
            if (!redisManager.isReady())
            {
                logger.warn('Redis not available, skipping rate limiting');
                return next();
            }

            try
            {
                const identifier = this.getIdentifier(req);
                const key = this.generateKey(identifier);
                const client = redisManager.getClient();

                // Skip if client is null
                if (!client)
                {
                    logger.warn('Redis client not available, skipping rate limiting');
                    return next();
                }

                // Use Redis pipeline for atomic operations
                const pipeline = client.pipeline();

                // Get current count
                const current = await client.get(key);
                const count = current ? parseInt(current, 10) : 0;

                // Check if limit exceeded
                if (count >= this.maxRequests)
                {
                    const ttl = await client.ttl(key);
                    const resetTime = new Date(Date.now() + (ttl * 1000));

                    logger.warn('Rate limit exceeded', {
                        identifier,
                        count,
                        limit: this.maxRequests,
                        resetTime: resetTime.toISOString()
                    });

                    // Set rate limit headers
                    res.set({
                        'X-RateLimit-Limit': this.maxRequests,
                        'X-RateLimit-Remaining': 0,
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Retry-After': Math.ceil(ttl)
                    });

                    return next(new AppError(this.message, 429));
                }

                // Increment counter
                if (count === 0)
                {
                    // First request in window - set with expiration
                    pipeline.setex(key, Math.ceil(this.windowMs / 1000), 1);
                } else
                {
                    // Increment existing counter
                    pipeline.incr(key);
                }

                await pipeline.exec();

                // Set response headers
                const remaining = Math.max(0, this.maxRequests - (count + 1));
                const resetTime = new Date(Date.now() + this.windowMs);

                res.set({
                    'X-RateLimit-Limit': this.maxRequests,
                    'X-RateLimit-Remaining': remaining,
                    'X-RateLimit-Reset': resetTime.toISOString()
                });

                logger.debug('Rate limit check passed', {
                    identifier,
                    count: count + 1,
                    remaining
                });

                next();

            } catch (error)
            {
                logger.error('Rate limiting error', { error: error.message });
                // On error, allow request to continue (fail open)
                next();
            }
        };
    }

    // Reset rate limit for specific identifier
    async reset(identifier)
    {
        if (!redisManager.isReady())
        {
            return false;
        }

        try
        {
            const key = this.generateKey(identifier);
            const client = redisManager.getClient();

            // Skip if client is null
            if (!client)
            {
                logger.warn('Redis client not available, skipping rate limit reset');
                return false;
            }

            const result = await client.del(key);

            logger.info('Rate limit reset', { identifier, success: result > 0 });
            return result > 0;
        } catch (error)
        {
            logger.error('Failed to reset rate limit', { identifier, error: error.message });
            return false;
        }
    }

    // Get current count for identifier
    async getCurrentCount(identifier)
    {
        if (!redisManager.isReady())
        {
            return 0;
        }

        try
        {
            const key = this.generateKey(identifier);
            const client = redisManager.getClient();

            // Skip if client is null
            if (!client)
            {
                logger.warn('Redis client not available, skipping get current count');
                return 0;
            }

            const count = await client.get(key);
            return count ? parseInt(count, 10) : 0;
        } catch (error)
        {
            logger.error('Failed to get current count', { identifier, error: error.message });
            return 0;
        }
    }

    // Get time until reset for identifier
    async getTimeUntilReset(identifier)
    {
        if (!redisManager.isReady())
        {
            return 0;
        }

        try
        {
            const key = this.generateKey(identifier);
            const client = redisManager.getClient();

            // Skip if client is null
            if (!client)
            {
                logger.warn('Redis client not available, skipping get time until reset');
                return 0;
            }

            const ttl = await client.ttl(key);
            return ttl > 0 ? ttl : 0;
        } catch (error)
        {
            logger.error('Failed to get TTL', { identifier, error: error.message });
            return 0;
        }
    }
}

// Create default rate limiter instance
export const createRateLimiter = (options) =>
{
    return new RedisRateLimiter(options);
};

// Export default instance
export default createRateLimiter; 