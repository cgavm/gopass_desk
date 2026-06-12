import Redis from 'ioredis';
import { logger } from '@shared/logger';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
  });

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

redis.on('connect', () => {
  logger.info('Redis connected');
});

const BLACKLIST_PREFIX = 'bl:';

export const blacklistToken = async (
  jti: string,
  ttlSeconds: number
): Promise<void> => {
  await redis.setex(`${BLACKLIST_PREFIX}${jti}`, ttlSeconds, '1');
};

export const isTokenBlacklisted = async (jti: string): Promise<boolean> => {
  const result = await redis.get(`${BLACKLIST_PREFIX}${jti}`);
  return result === '1';
};
