import Redis from 'ioredis';
import { config } from './index';
import { logger } from './logger';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis | null {
  return redisClient;
}

export async function connectRedis(): Promise<void> {
  try {
    redisClient = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: () => null, // Don't retry — fail fast
      reconnectOnError: () => false,
    });

    redisClient.on('error', (err) => {
      logger.error('Redis error', { err: err.message });
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected');
    });

    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed — running without Redis cache', { error });
    redisClient = null;
  }
}

/**
 * Store a value in Redis with optional TTL (seconds).
 */
export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> {
  if (!redisClient) return;
  if (ttlSeconds) {
    await redisClient.setex(key, ttlSeconds, value);
  } else {
    await redisClient.set(key, value);
  }
}

/**
 * Retrieve a value from Redis.
 */
export async function redisGet(key: string): Promise<string | null> {
  if (!redisClient) return null;
  return redisClient.get(key);
}

/**
 * Delete a key from Redis.
 */
export async function redisDel(key: string): Promise<void> {
  if (!redisClient) return;
  await redisClient.del(key);
}
