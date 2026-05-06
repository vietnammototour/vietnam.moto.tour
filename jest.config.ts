import type {Config} from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.jest.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.css$': '<rootDir>/src/__mocks__/styleMock.ts',
    '^swiper/css$': '<rootDir>/src/__mocks__/styleMock.ts',
    '^swiper/css/(.*)$': '<rootDir>/src/__mocks__/styleMock.ts',
    '^framer-motion$': '<rootDir>/src/__mocks__/framer-motion.tsx',
  },
  transformIgnorePatterns: ['node_modules/(?!(jose|@panva)/)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: [
    '<rootDir>/src/**/*.spec.{ts,tsx}',
    '<rootDir>/__tests__/**/*.spec.{ts,tsx}',
    '<rootDir>/scripts/**/*.spec.{ts,tsx}',
  ],
  modulePathIgnorePatterns: ['<rootDir>/.worktrees/'],
};

export default config;
