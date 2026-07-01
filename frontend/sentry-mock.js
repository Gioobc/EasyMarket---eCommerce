// Lightweight Sentry shim for development / Expo bundling when @sentry/react-native
// is not installed. Exports the minimal API used by the app.
module.exports = {
  init: function () {},
  captureException: function () {},
  captureMessage: function () {},
  addBreadcrumb: function () {},
  setUser: function () {},
  setTag: function () {},
};
