'use strict';

const {execFileSync} = require('child_process');
const {mkdtempSync, readFileSync, rmSync} = require('fs');
const {tmpdir} = require('os');
const {join} = require('path');

const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
const temporaryDirectory = mkdtempSync(
  join(tmpdir(), 'react-native-nfc-manager-pack-'),
);

try {
  const npmCli = process.env.npm_execpath;
  if (!npmCli) {
    throw new Error('npm_execpath is unavailable; run this check through npm');
  }

  const output = execFileSync(
    process.execPath,
    [npmCli, 'pack', '--dry-run', '--json', '--ignore-scripts'],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
      env: {
        ...process.env,
        npm_config_cache: join(temporaryDirectory, 'npm-cache'),
      },
    },
  );
  const [pack] = JSON.parse(output);
  const files = new Set(pack.files.map(({path}) => path));

  const requiredFiles = [
    packageJson.main,
    packageJson.types,
    'specs/NativeNfcManager.ts',
    'android/build.gradle',
    'android/src/main/AndroidManifest.xml',
    'ios/RNNfcManager.swift',
    'react-native-nfc-manager.podspec',
    'app.plugin.js',
  ];
  const missingFiles = requiredFiles.filter((path) => !files.has(path));
  if (missingFiles.length > 0) {
    throw new Error(`Package is missing required files:\n${missingFiles.join('\n')}`);
  }

  const forbiddenPatterns = [
    /^android\/build\//,
    /^ios\/build\//,
    /\/(?:build|generated)\//,
    /\.(?:class|dex)$/,
  ];
  const forbiddenFiles = [...files].filter((path) =>
    forbiddenPatterns.some((pattern) => pattern.test(path)),
  );
  if (forbiddenFiles.length > 0) {
    throw new Error(
      `Package contains generated build artifacts:\n${forbiddenFiles.join('\n')}`,
    );
  }

  console.log(
    `Verified ${pack.entryCount} package files for ${pack.id}; required files are present and generated build artifacts are absent.`,
  );
} finally {
  rmSync(temporaryDirectory, {recursive: true, force: true});
}
