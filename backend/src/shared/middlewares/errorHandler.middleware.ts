import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '@infrastructure/cache/redis.client';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err }, 'Non-operational error');
    }
    res.status(err.statusCode).json({
      error: err.name.replace('Error', ''),
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  // Unexpected error
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({
    error: 'InternalServerError',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    statusCode: 500,
  });
}

export function notFoundHandler(
  _req: Request,
  _res: Response,
  next: NextFunction
): void {
  next(new AppError('Resource not found', 404));
}
