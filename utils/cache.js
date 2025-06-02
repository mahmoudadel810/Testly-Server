import redisManager from './redis.js';
import logger from './logger.js';
import fastJson from 'fast-json-stringify';

// Fast JSON stringify schemas for different data types
const schemas = {
    exam: fastJson({
        type: 'object',
        properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            duration: { type: 'number' },
            passingScore: { type: 'number' },
            questions: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        text: { type: 'string' },
                        options: { type: 'array', items: { type: 'string' } },
                        correctAnswer: { type: 'number' },
                        points: { type: 'number' }
                    }
                }
            },
            createdBy: {
                anyOf: [
                    { type: 'string' },
                    { type: 'null' },
                    {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            username: { type: 'string' },
                            email: { type: 'string' },
                            role: { type: 'string' }
                        }
                    }
                ]
            },
            teacherId: {
                anyOf: [
                    { type: 'string' },
                    { type: 'null' },
                    {
                        type: 'object',
                        properties: {
                            _id: { type: 'string' },
                            name: { type: 'string' },
                            email: { type: 'string' }
                        }
                    }
                ]
            },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
        }
    }),
    user: fastJson({
        type: 'object',
        properties: {
            _id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string' },
            isConfirmed: { type: 'boolean' },
            isLoggedIn: { type: 'boolean' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
        }
    }),
    attempt: fastJson({
        type: 'object',
        properties: {
            _id: { type: 'string' },
            examId: { type: 'string' },
            userId: { type: 'string' },
            teacherId: { type: 'string' },
            score: { type: 'number' },
            totalPoints: { type: 'number' },
            passed: { type: 'boolean' },
            isCompleted: { type: 'boolean' },
            startTime: { type: 'string' },
            endTime: { type: 'string' },
            answers: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        questionId: { type: 'string' },
                        selectedOption: { type: 'number' },
                        isCorrect: { type: 'boolean' },
                        points: { type: 'number' }
                    }
                }
            },
            createdAt: { type: 'string' },
            updatedAt: { type: 'string' }
        }
    })
};

class CacheManager
{
    constructor()
    {
        this.defaultTTL = {
            exams: 60 * 60, // 1 hour
            examQuestions: 60 * 30, // 30 minutes
            users: 60 * 15, // 15 minutes
            userProfiles: 60 * 10, // 10 minutes
            attempts: 60 * 60 * 2, // 2 hours
            sessions: 60 * 60 * 24, // 24 hours
            teacherExams: 60 * 30, // 30 minutes
            examResults: 60 * 60 * 6, // 6 hours
        };

        this.keyPrefixes = {
            exam: 'exam:',
            examQuestions: 'exam:questions:',
            examsByTeacher: 'exams:teacher:',
            user: 'user:',
            userProfile: 'user:profile:',
            attempt: 'attempt:',
            userAttempts: 'attempts:user:',
            teacherAttempts: 'attempts:teacher:',
            examAttempts: 'attempts:exam:',
            session: 'session:',
            examResults: 'results:exam:',
            userResults: 'results:user:',
        };
    }

    // Generate cache key
    generateKey(prefix, id, suffix = '')
    {
        return `${prefix}${id}${suffix ? `:${suffix}` : ''}`;
    }

    // Serialize data based on type
    serialize(data, type = 'generic')
    {
        try
        {
            if (schemas[type])
            {
                return schemas[type](data);
            }
            return JSON.stringify(data);
        } catch (error)
        {
            logger.warn('Serialization failed, falling back to JSON.stringify', { error: error.message, type });
            return JSON.stringify(data);
        }
    }

    // Deserialize data
    deserialize(data)
    {
        try
        {
            return JSON.parse(data);
        } catch (error)
        {
            logger.error('Failed to deserialize cached data', { error: error.message });
            return null;
        }
    }

    // Generic get method
    async get(key)
    {
        if (!redisManager.isReady())
        {
            logger.debug('Redis not available, skipping cache get', { key });
            return null;
        }

        try
        {
            const client = redisManager.getClient();
            if (!client)
            {
                logger.debug('Redis client not available, skipping cache get', { key });
                return null;
            }
            const data = await client.get(key);

            if (!data)
            {
                logger.debug('Cache miss', { key });
                return null;
            }

            logger.debug('Cache hit', { key });
            return this.deserialize(data);
        } catch (error)
        {
            logger.error('Cache get operation failed', { key, error: error.message });
            return null;
        }
    }

    // Generic set method
    async set(key, data, ttl = 3600, type = 'generic')
    {
        if (!redisManager.isReady())
        {
            logger.debug('Redis not available, skipping cache set', { key });
            return false;
        }

        try
        {
            const client = redisManager.getClient();
            if (!client)
            {
                logger.debug('Redis client not available, skipping cache set', { key });
                return false;
            }
            const serializedData = this.serialize(data, type);

            if (ttl > 0)
            {
                await client.setex(key, ttl, serializedData);
            } else
            {
                await client.set(key, serializedData);
            }

            logger.debug('Cache set successful', { key, ttl });
            return true;
        } catch (error)
        {
            logger.error('Cache set operation failed', { key, error: error.message });
            return false;
        }
    }

    // Delete single key
    async del(key)
    {
        if (!redisManager.isReady())
        {
            return false;
        }

        try
        {
            const client = redisManager.getClient();
            if (!client)
            {
                logger.debug('Redis client not available, skipping cache delete', { key });
                return false;
            }
            const result = await client.del(key);
            logger.debug('Cache delete successful', { key, deleted: result });
            return result > 0;
        } catch (error)
        {
            logger.error('Cache delete operation failed', { key, error: error.message });
            return false;
        }
    }

    // Delete multiple keys by pattern
    async delPattern(pattern)
    {
        if (!redisManager.isReady())
        {
            return 0;
        }

        try
        {
            const client = redisManager.getClient();
            if (!client)
            {
                logger.debug('Redis client not available, skipping pattern delete', { pattern });
                return 0;
            }
            const keys = await client.keys(pattern);

            if (keys.length === 0)
            {
                return 0;
            }

            const result = await client.del(...keys);
            logger.debug('Cache pattern delete successful', { pattern, deleted: result });
            return result;
        } catch (error)
        {
            logger.error('Cache pattern delete operation failed', { pattern, error: error.message });
            return 0;
        }
    }

    // Exam-specific methods
    async getExam(examId)
    {
        const key = this.generateKey(this.keyPrefixes.exam, examId);
        return await this.get(key);
    }

    async setExam(examId, examData)
    {
        const key = this.generateKey(this.keyPrefixes.exam, examId);
        return await this.set(key, examData, this.defaultTTL.exams, 'exam');
    }

    async getExamQuestions(examId)
    {
        const key = this.generateKey(this.keyPrefixes.examQuestions, examId);
        return await this.get(key);
    }

    async setExamQuestions(examId, questions)
    {
        const key = this.generateKey(this.keyPrefixes.examQuestions, examId);
        return await this.set(key, questions, this.defaultTTL.examQuestions);
    }

    async getExamsByTeacher(teacherId)
    {
        const key = this.generateKey(this.keyPrefixes.examsByTeacher, teacherId);
        return await this.get(key);
    }

    async setExamsByTeacher(teacherId, exams)
    {
        const key = this.generateKey(this.keyPrefixes.examsByTeacher, teacherId);
        return await this.set(key, exams, this.defaultTTL.teacherExams);
    }

    // User-specific methods
    async getUser(userId)
    {
        const key = this.generateKey(this.keyPrefixes.user, userId);
        return await this.get(key);
    }

    async setUser(userId, userData)
    {
        const key = this.generateKey(this.keyPrefixes.user, userId);
        return await this.set(key, userData, this.defaultTTL.users, 'user');
    }

    async getUserProfile(userId)
    {
        const key = this.generateKey(this.keyPrefixes.userProfile, userId);
        return await this.get(key);
    }

    async setUserProfile(userId, profileData)
    {
        const key = this.generateKey(this.keyPrefixes.userProfile, userId);
        return await this.set(key, profileData, this.defaultTTL.userProfiles, 'user');
    }

    // Attempt-specific methods
    async getAttempt(attemptId)
    {
        const key = this.generateKey(this.keyPrefixes.attempt, attemptId);
        return await this.get(key);
    }

    async setAttempt(attemptId, attemptData)
    {
        const key = this.generateKey(this.keyPrefixes.attempt, attemptId);
        return await this.set(key, attemptData, this.defaultTTL.attempts, 'attempt');
    }

    async getUserAttempts(userId)
    {
        const key = this.generateKey(this.keyPrefixes.userAttempts, userId);
        return await this.get(key);
    }

    async setUserAttempts(userId, attempts)
    {
        const key = this.generateKey(this.keyPrefixes.userAttempts, userId);
        return await this.set(key, attempts, this.defaultTTL.attempts);
    }

    async getExamAttempts(examId)
    {
        const key = this.generateKey(this.keyPrefixes.examAttempts, examId);
        return await this.get(key);
    }

    async setExamAttempts(examId, attempts)
    {
        const key = this.generateKey(this.keyPrefixes.examAttempts, examId);
        return await this.set(key, attempts, this.defaultTTL.attempts);
    }

    // Session management
    async getSession(sessionId)
    {
        const key = this.generateKey(this.keyPrefixes.session, sessionId);
        return await this.get(key);
    }

    async setSession(sessionId, sessionData)
    {
        const key = this.generateKey(this.keyPrefixes.session, sessionId);
        return await this.set(key, sessionData, this.defaultTTL.sessions);
    }

    async deleteSession(sessionId)
    {
        const key = this.generateKey(this.keyPrefixes.session, sessionId);
        return await this.del(key);
    }

    // Cache invalidation methods
    async invalidateExam(examId)
    {
        const patterns = [
            this.generateKey(this.keyPrefixes.exam, examId),
            this.generateKey(this.keyPrefixes.examQuestions, examId),
            this.generateKey(this.keyPrefixes.examAttempts, examId),
            this.generateKey(this.keyPrefixes.examResults, examId),
        ];

        let deletedCount = 0;
        for (const pattern of patterns)
        {
            const deleted = await this.del(pattern);
            if (deleted) deletedCount++;
        }

        // Also invalidate teacher's exam list
        await this.delPattern(`${this.keyPrefixes.examsByTeacher}*`);

        logger.info('Exam cache invalidated', { examId, deletedCount });
        return deletedCount;
    }

    async invalidateUser(userId)
    {
        const patterns = [
            this.generateKey(this.keyPrefixes.user, userId),
            this.generateKey(this.keyPrefixes.userProfile, userId),
            this.generateKey(this.keyPrefixes.userAttempts, userId),
            this.generateKey(this.keyPrefixes.userResults, userId),
        ];

        let deletedCount = 0;
        for (const pattern of patterns)
        {
            const deleted = await this.del(pattern);
            if (deleted) deletedCount++;
        }

        logger.info('User cache invalidated', { userId, deletedCount });
        return deletedCount;
    }

    async invalidateTeacherData(teacherId)
    {
        const patterns = [
            `${this.keyPrefixes.examsByTeacher}${teacherId}`,
            `${this.keyPrefixes.teacherAttempts}${teacherId}`,
        ];

        let deletedCount = 0;
        for (const pattern of patterns)
        {
            const deleted = await this.del(pattern);
            if (deleted) deletedCount++;
        }

        logger.info('Teacher cache invalidated', { teacherId, deletedCount });
        return deletedCount;
    }

    // Health check
    async healthCheck()
    {
        try
        {
            // Use the built-in health check from RedisManager
            return await redisManager.healthCheck();
        } catch (error)
        {
            return {
                status: 'error',
                message: error.message
            };
        }
    }
}

// Singleton instance
const cacheManager = new CacheManager();

export default cacheManager;
export { cacheManager }; 