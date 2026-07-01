const { getDefaultConfig } = require('@expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

// Map @sentry/react-native to a local shim during bundling so projects that
// don't have the native package installed (Expo managed) won't fail the packager.
defaultConfig.resolver = defaultConfig.resolver || {};
defaultConfig.resolver.extraNodeModules = Object.assign({}, defaultConfig.resolver.extraNodeModules, {
  '@sentry/react-native': path.resolve(__dirname, 'sentry-mock'),
});

module.exports = defaultConfig;
