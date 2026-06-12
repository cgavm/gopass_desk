import { Request, Response, NextFunction } from 'express';
import { redis } from '@infrastructure/cache/redis.client';
import { AppError } from '../errors/AppError';

interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
  keyPrefix: string;
}

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip ?? 'unknown';
}

export function rateLimiter(options: RateLimitOptions) {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const key = `${options.keyPrefix}:${getClientIp(req)}`;
      const windowSeconds = Math.ceil(options.windowMs / 1000);

      const current = await redis.incr(key);

      if (current === 1) {
        await redis.expire(key, windowSeconds);
      }

      if (current > options.maxRequests) {
        const ttl = await redis.ttl(key);
        return next(
          new AppError(
            `Rate limit exceeded. Retry after ${ttl} seconds`,
            429
          )
        );
      }

      next();
    } catch {
      // If Redis fails, allow request through
      next();
    }
  };
}

// Pre-configured limiters
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10,
  keyPrefix: 'rl:auth',
});

export const globalRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
  keyPrefix: 'rl:global',
});
