const mongoose = require('mongoose');
const Redis = require('ioredis');
const logger = require('../utils/logger');

class DatabaseManager {
  constructor() {
    this.mongodb = null;
    this.redis = null;
    this.isConnected = false;
  }

  async connectMongoDB() {
    try {
      if (!process.env.MONGODB_URI) {
        logger.warn('MongoDB URI not provided, using in-memory storage');
        return null;
      }

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferMaxEntries: 0,
        bufferCommands: false
      };

      this.mongodb = await mongoose.connect(process.env.MONGODB_URI, options);
      logger.info('MongoDB connected successfully');
      return this.mongodb;
    } catch (error) {
      logger.error('MongoDB connection failed:', error);
      throw error;
    }
  }

  async connectRedis() {
    try {
      if (!process.env.REDIS_URL) {
        logger.warn('Redis URL not provided, using in-memory cache');
        return null;
      }

      const redisOptions = {
        retryDelayOnFailover: 100,
        enableReadyCheck: true,
        maxRetriesPerRequest: 3,
        lazyConnect: true
      };

      this.redis = new Redis(process.env.REDIS_URL, redisOptions);

      this.redis.on('connect', () => {
        logger.info('Redis connected successfully');
      });

      this.redis.on('error', error => {
        logger.error('Redis connection error:', error);
      });

      await this.redis.connect();
      return this.redis;
    } catch (error) {
      logger.error('Redis connection failed:', error);
      throw error;
    }
  }

  async connect() {
    try {
      await Promise.all([this.connectMongoDB(), this.connectRedis()]);

      this.isConnected = true;
      logger.info('Database connections established');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.mongodb) {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
      }

      if (this.redis) {
        await this.redis.disconnect();
        logger.info('Redis disconnected');
      }

      this.isConnected = false;
      logger.info('All database connections closed');
    } catch (error) {
      logger.error('Error disconnecting databases:', error);
      throw error;
    }
  }

  // Cache methods
  async setCache(key, value, ttl = 3600) {
    try {
      if (this.redis) {
        await this.redis.setex(key, ttl, JSON.stringify(value));
      }
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async getCache(key) {
    try {
      if (this.redis) {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      }
      return null;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async deleteCache(key) {
    try {
      if (this.redis) {
        await this.redis.del(key);
      }
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async clearCache(pattern = '*') {
    try {
      if (this.redis) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      }
    } catch (error) {
      logger.error('Cache clear error:', error);
    }
  }

  // Health check
  async healthCheck() {
    const health = {
      mongodb: false,
      redis: false,
      timestamp: new Date().toISOString()
    };

    try {
      if (this.mongodb) {
        await mongoose.connection.db.admin().ping();
        health.mongodb = true;
      }
    } catch (error) {
      logger.error('MongoDB health check failed:', error);
    }

    try {
      if (this.redis) {
        await this.redis.ping();
        health.redis = true;
      }
    } catch (error) {
      logger.error('Redis health check failed:', error);
    }

    return health;
  }
}

// Singleton instance
const databaseManager = new DatabaseManager();

module.exports = databaseManager;
