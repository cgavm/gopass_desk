import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { logger } from '@shared/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error({ err, path: req.path, method: req.method }, 'Non-operational error');
    }
    res.status(err.statusCode).json({
      error: err.name.replace('Error', ''),
      message: err.message,
      statusCode: err.statusCode,
    });
    return;
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');
  res.status(500).json({
    error: 'InternalServerError',
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    statusCode: 500,
  });
};

export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(new AppError(`Resource not found: ${req.path}`, 404));
};
