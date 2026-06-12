import { jest } from '@jest/globals';

// Mock Redis
jest.mock('@infrastructure/cache/redis.client', () => ({
  redis: {
    get: jest.fn(),
    setex: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    ttl: jest.fn(),
    del: jest.fn(),
    ping: jest.fn(),
    quit: jest.fn(),
  },
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
  blacklistToken: jest.fn(),
  isTokenBlacklisted: jest.fn(),
}));

// Mock Socket.IO
jest.mock('@infrastructure/sockets/socket.server', () => ({
  emitToProject: jest.fn(),
  emitToUser: jest.fn(),
  getSocketIO: jest.fn(),
  initializeSocket: jest.fn(),
}));
