import * as Sentry from '@sentry/react-native';

const DSN = process.env.SENTRY_DSN || 'https://8bc9c2eb9d397e5232a1ec211b900f7f@o4511439874162688.ingest.us.sentry.io/4511439881502720';

// Don't initialize Sentry during unit tests to avoid network calls.
if (process.env.NODE_ENV !== 'test') {
  try {
    Sentry.init({
      dsn: DSN,
      tracesSampleRate: 0.0, // keep low for development; adjust as needed
    });
    // Optional: set release from env if available
    if (process.env.EXPO_RELEASE || process.env.SENTRY_RELEASE) {
      Sentry.setTag('release', process.env.EXPO_RELEASE || process.env.SENTRY_RELEASE);
    }
  } catch (e) {
    // initialization should not crash the app in development
    // eslint-disable-next-line no-console
    console.warn('Sentry init failed', e);
  }
}

export const captureException = (e: unknown) => {
  try {
    Sentry.captureException(e);
  } catch (_) {
    // swallow
  }
};

export default Sentry;
