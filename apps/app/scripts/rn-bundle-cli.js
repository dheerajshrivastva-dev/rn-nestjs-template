#!/usr/bin/env node
/**
 * rn-bundle-cli.js
 *
 * Thin shim so the React Native 0.82 Gradle plugin can call:
 *   node rn-bundle-cli.js bundle --platform android ...
 *
 * RN 0.82 removed the `bundle` command from @react-native-community/cli.
 * Bundling now goes through react-native/scripts/bundle.js which uses
 * @react-native/community-cli-plugin directly.
 *
 * This script:
 *  1. Strips the leading "bundle" subcommand that Gradle always passes
 *  2. Generates project config from the demiAdmin project root (not monorepo root)
 *     so loadMetroConfig finds metro.config.js in apps/demiAdmin/
 *  3. Delegates to react-native/scripts/bundle.js
 */

'use strict';

const { execSync, spawnSync } = require('child_process');
const path = require('path');

// The actual React Native project root (apps/demiAdmin).
// This script lives in apps/demiAdmin/scripts/, so go up one level.
const projectRoot = path.resolve(__dirname, '..');

// argv[2] is "bundle" (the subcommand Gradle always passes) — drop it
const args = process.argv.slice(3); // everything after "bundle"

// Resolve react-native from the project root
const rnDir = path.dirname(
  require.resolve('react-native/package.json', { paths: [projectRoot] })
);
const bundleScript = path.join(rnDir, 'scripts', 'bundle.js');

// Generate the project config from the RN project root (not monorepo root).
// This ensures ctx.root = apps/demiAdmin so metro.config.js is found there.
let config;
try {
  const raw = execSync('npx react-native config', {
    encoding: 'utf8',
    cwd: projectRoot,
    stdio: ['pipe', 'pipe', 'ignore'],
  });
  config = raw.trim();
} catch (e) {
  process.stderr.write(`rn-bundle-cli: failed to run "react-native config": ${e.message}\n`);
  process.exit(1);
}

// Delegate to react-native/scripts/bundle.js
const result = spawnSync(
  process.execPath,
  [bundleScript, '--load-config', config, ...args],
  {
    stdio: 'inherit',
    cwd: projectRoot,
  }
);

process.exit(result.status ?? 1);
