module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Garante que o Jest procure os testes na pasta correta
  testMatch: ['**/studentTests/**/*.test.ts'],
  // Ajuda o TS a resolver módulos caso você use aliases (@/)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
};