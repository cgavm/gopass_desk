import { jest } from '@jest/globals';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as authService from '@modules/auth/auth.service';
import { prisma } from '@infrastructure/database/prisma.client';
import { isTokenBlacklisted } from '@infrastructure/cache/redis.client';

// Mock Prisma
jest.mock('@infrastructure/database/prisma.client', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock jwt
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(() => 'mock-token'),
  verify: jest.fn(),
}));

// Mock bcrypt
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

const mockedPrisma = prisma as unknown as {
  user: { findUnique: jest.Mock };
};
const mockedJwtVerify = jwt.verify as jest.Mock;
const mockedBcryptCompare = bcrypt.compare as jest.Mock;
const mockedIsTokenBlacklisted = isTokenBlacklisted as jest.Mock;

process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('auth.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'USER' as const,
        passwordHash: 'hashed',
        isActive: true,
      };

      mockedPrisma.user.findUnique.mockResolvedValue(user);
      mockedBcryptCompare.mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should fail with invalid credentials (user not found)', async () => {
      mockedPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'x@x.com', password: 'pass' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should fail with inactive user', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'USER' as const,
        passwordHash: 'hashed',
        isActive: false,
      };

      mockedPrisma.user.findUnique.mockResolvedValue(user);

      await expect(
        authService.login({ email: 'test@example.com', password: 'pass' })
      ).rejects.toThrow('Account is deactivated');
    });

    it('should fail with wrong password', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'USER' as const,
        passwordHash: 'hashed',
        isActive: true,
      };

      mockedPrisma.user.findUnique.mockResolvedValue(user);
      mockedBcryptCompare.mockResolvedValue(false);

      await expect(
        authService.login({ email: 'test@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refresh', () => {
    it('should return new tokens on valid refresh', async () => {
      const user = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test',
        role: 'USER' as const,
        isActive: true,
      };

      mockedJwtVerify.mockReturnValue({
        sub: 'user-1',
        jti: 'jti-1',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      mockedIsTokenBlacklisted.mockResolvedValue(false);
      mockedPrisma.user.findUnique.mockResolvedValue(user);

      const result = await authService.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should fail with blacklisted token', async () => {
      mockedJwtVerify.mockReturnValue({
        sub: 'user-1',
        jti: 'jti-1',
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
      mockedIsTokenBlacklisted.mockResolvedValue(true);

      await expect(authService.refresh('blacklisted-token')).rejects.toThrow(
        'Refresh token revoked'
      );
    });

    it('should fail with invalid token', async () => {
      mockedJwtVerify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authService.refresh('invalid')).rejects.toThrow(
        'Invalid refresh token'
      );
    });
  });
});
