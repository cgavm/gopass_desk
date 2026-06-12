import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '@infrastructure/database/prisma.client';
import { blacklistToken, isTokenBlacklisted } from '@infrastructure/cache/redis.client';
import { logger } from '@shared/logger';
import { UnauthorizedError, ForbiddenError } from '@shared/errors/AppError';
import { LoginInput } from './auth.dto';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? '';
const ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
const REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

interface TokenPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  jti: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const generateTokens = (user: {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}): TokenPair => {
  const jtiAccess = crypto.randomUUID();
  const jtiRefresh = crypto.randomUUID();

  const accessToken = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      jti: jtiAccess,
    } as TokenPayload,
    JWT_ACCESS_SECRET as jwt.Secret,
    { expiresIn: ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, jti: jtiRefresh } as Pick<TokenPayload, 'sub' | 'jti'>,
    JWT_REFRESH_SECRET as jwt.Secret,
    { expiresIn: REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );

  return { accessToken, refreshToken };
};

export const login = async (input: LoginInput): Promise<TokenPair> => {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user) {
    logger.warn({ email: input.email }, 'Login attempt for unknown email');
    throw new UnauthorizedError('Invalid credentials');
  }

  if (!user.isActive) {
    logger.warn({ userId: user.id }, 'Login attempt on deactivated account');
    throw new ForbiddenError('Account is deactivated');
  }

  const validPassword = await bcrypt.compare(input.password, user.passwordHash);

  if (!validPassword) {
    logger.warn({ userId: user.id }, 'Login attempt with invalid password');
    throw new UnauthorizedError('Invalid credentials');
  }

  logger.info({ userId: user.id, role: user.role }, 'User logged in');
  return generateTokens(user);
};

export const refresh = async (refreshToken: string): Promise<TokenPair> => {
  let decoded: { sub: string; jti: string; exp: number };

  try {
    decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      sub: string;
      jti: string;
      exp: number;
    };
  } catch {
    throw new UnauthorizedError('Invalid refresh token');
  }

  const blacklisted = await isTokenBlacklisted(decoded.jti);
  if (blacklisted) {
    logger.warn({ userId: decoded.sub }, 'Refresh token already revoked');
    throw new UnauthorizedError('Refresh token revoked');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

  if (!user || !user.isActive) {
    throw new UnauthorizedError('User not found or deactivated');
  }

  const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
  if (ttl > 0) {
    await blacklistToken(decoded.jti, ttl);
  }

  logger.info({ userId: user.id }, 'Token refreshed');
  return generateTokens(user);
};

export const logout = async (refreshToken: string): Promise<void> => {
  try {
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as {
      jti: string;
      exp: number;
      sub: string;
    };
    const ttl = Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    if (ttl > 0) {
      await blacklistToken(decoded.jti, ttl);
    }
    logger.info({ userId: decoded.sub }, 'User logged out');
  } catch {
    // Token invalid or expired — already effectively logged out
  }
};

export const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user;
};
