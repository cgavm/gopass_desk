import 'dotenv/config';
import { createServer } from 'http';
import { z } from 'zod';
import app from './app';
import { prisma } from '@infrastructure/database/prisma.client';
import { logger } from '@shared/logger';
import { redis } from '@infrastructure/cache/redis.client';
import { initializeSocket } from '@infrastructure/sockets/socket.server';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  PORT: z.string().default('3001').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  ALLOWED_ORIGINS: z.string().default('http://localhost:5173'),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  logger.error(
    { errors: env.error.format() },
    'Environment validation failed'
  );
  process.exit(1);
}

const PORT = env.data.PORT;

async function bootstrap(): Promise<void> {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connected');

    // Test Redis connection
    await redis.ping();
    logger.info('Redis connected');

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    initializeSocket(httpServer);
    logger.info('Socket.IO initialized');

    // Start server
    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${env.data!.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error({ error }, 'Failed to start server');
    process.exit(1);
  }
}

void bootstrap();

// Graceful shutdown
process.on('SIGTERM', () => {
  void (async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  })();
});

process.on('SIGINT', () => {
  void (async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await prisma.$disconnect();
    await redis.quit();
    process.exit(0);
  })();
});
