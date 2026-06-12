import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@infrastructure/(.*)$': '<rootDir>/src/infrastructure/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/server.ts',
    '!src/app.ts',
    '!src/infrastructure/**',
    '!src/shared/middlewares/**',
  ],
  coverageThreshold: {
    global: {
      branches: 45,
      functions: 60,
      lines: 75,
      statements: 70,
    },
  },
  clearMocks: true,
  restoreMocks: true,
};

export default config;
