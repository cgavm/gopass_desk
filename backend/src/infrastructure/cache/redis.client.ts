import Redis from 'ioredis';
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: ['*.email', '*.name', 'password', '*.password', '*.passwordHash'],
    remove: true,
  },
  transport:
    process.env.NODE_ENV === 'development'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

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

// Refresh token blacklist helpers
const BLACKLIST_PREFIX = 'bl:';

export async function blacklistToken(
  jti: string,
  ttlSeconds: number
): Promise<void> {
  await redis.setex(`${BLACKLIST_PREFIX}${jti}`, ttlSeconds, '1');
}

export async function isTokenBlacklisted(jti: string): Promise<boolean> {
  const result = await redis.get(`${BLACKLIST_PREFIX}${jti}`);
  return result === '1';
}
