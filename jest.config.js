/**
 * @see https://jestjs.io/docs/en/configuration.html
 */

module.exports = {
  rootDir: process.cwd(),
  roots: ['<rootDir>/lib/', '<rootDir>/src/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  testMatch: ['<rootDir>/src/**/*.spec.+(ts|tsx|js)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },

  notify: true,
};
