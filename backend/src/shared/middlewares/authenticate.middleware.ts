import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../errors/AppError';

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'USER';
  jti: string;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token required');
    }

    const token = authHeader.slice(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET ?? ''
    ) as TokenPayload;

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      name: decoded.name,
      role: decoded.role,
    };

    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired access token'));
  }
}
