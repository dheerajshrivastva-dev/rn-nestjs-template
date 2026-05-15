const path = require('path');

// pnpm with node-linker=hoisted puts all packages at the monorepo root
// node_modules. Tell RN CLI autolinking to search there.
const monoRoot = path.resolve(__dirname, '../..');

module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts/'],
  reactNativePath: path.resolve(monoRoot, 'node_modules/react-native'),
  // Autolinking search paths — monorepo root first, then local fallback
  nodeModulesPaths: [
    path.resolve(monoRoot, 'node_modules'),
    path.resolve(__dirname, 'node_modules'),
  ],
  dependencies: {
    // Frame processors not used — exclude to avoid CMake/Hermes link error
    'react-native-worklets-core': {
      platforms: { android: null, ios: null },
    },
  },
};
