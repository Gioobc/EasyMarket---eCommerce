import * as Sentry from '@sentry/react-native';

describe('Sentry mock', () => {
  it('should have Sentry mocked in tests', () => {
    const err = new Error('unit test error');
    const anySentry = Sentry as unknown as { captureException: jest.Mock };
    anySentry.captureException(err);
    expect(anySentry.captureException).toHaveBeenCalledWith(err);
  });
});
