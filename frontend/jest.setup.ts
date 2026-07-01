/// <reference types="jest" />
// Jest setup file: mock Sentry to avoid network calls and allow assertions
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  addBreadcrumb: jest.fn(),
  setUser: jest.fn(),
  setTag: jest.fn(),
}));

// Provide a helpful global for tests
__SENTRY_MOCKED__ = true;
