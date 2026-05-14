const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const {
  withSentryConfig
} = require("@sentry/react-native/metro");

/**
 * Metro configuration for monorepo
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

// Get the project root (monorepo root)
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = {
  projectRoot,
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    // Enable symlink resolution for workspace packages
    unstable_enableSymlinks: true,
  },
};

module.exports = withSentryConfig(mergeConfig(getDefaultConfig(__dirname), config));