#!/usr/bin/env node
'use strict';

const {execFileSync} = require('child_process');
const {copyFileSync, mkdtempSync, readFileSync} = require('fs');
const {tmpdir} = require('os');
const {join, resolve} = require('path');
const {packLibrary, runNpm} = require('./codegen-compatibility');
const {
  EXPO_CONSUMER,
  configureConsumer,
  createGeneratorArgs,
  resolveInstalledLibrary,
  verifyGeneratedConfiguration,
} = require('./expo-consumer');

function prepareExpoSmoke(dependencies = {}) {
  const root = dependencies.repositoryRoot ?? resolve(__dirname, '..');
  const temporaryRoot = dependencies.mkdtempSync?.(join(tmpdir(), 'rn-nfc-expo-smoke-')) ??
    mkdtempSync(join(tmpdir(), 'rn-nfc-expo-smoke-'));
  const consumer = join(temporaryRoot, EXPO_CONSUMER.appName);
  const runner = dependencies.runNpm ?? runNpm;
  const logger = dependencies.logger ?? console.log;
  const exec = dependencies.exec ?? ((command, args, options = {}) =>
    execFileSync(command, args, {
      ...options,
      env: {
        ...process.env,
        ...options.env,
        npm_config_cache: join(temporaryRoot, 'npm-cache'),
      },
    }));
  const commands = {...dependencies, exec};
  try {
    const tarball = (dependencies.packLibrary ?? packLibrary)(root, temporaryRoot, commands);
    runner(createGeneratorArgs(consumer), {execOptions: {cwd: temporaryRoot}}, commands);
    configureConsumer(consumer, tarball);
    copyFileSync(join(root, 'example-expo', 'App.tsx'), join(consumer, 'App.tsx'));
    copyFileSync(join(root, 'example-expo', 'flows.ts'), join(consumer, 'flows.ts'));
    runner(['install'], {execOptions: {cwd: consumer}}, commands);
    runner(
      ['exec', 'expo', '--', 'install', 'expo-dev-client', 'react-native-safe-area-context'],
      {execOptions: {cwd: consumer}},
      commands,
    );
    runner(
      ['exec', 'expo', '--', 'prebuild', '--clean', '--no-install'],
      {execOptions: {cwd: consumer}},
      commands,
    );
    verifyGeneratedConfiguration(consumer);
    const installed = resolveInstalledLibrary(consumer, root);
    const expected = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version;
    if (installed.packageJson.version !== expected) {
      throw new Error(`Expected packed version ${expected}, found ${installed.packageJson.version}`);
    }
    logger(`Expo NFC smoke consumer: ${consumer}`);
    logger(`Packed candidate: ${tarball}`);
    logger(`iOS device: cd '${consumer}' && npx expo run:ios --device`);
    logger(`Android device: cd '${consumer}' && npx expo run:android --device`);
    logger(`Metro: cd '${consumer}' && npx expo start --dev-client`);
    logger('Preparation/build is not physical NFC evidence. Record scans separately.');
    return {consumer, tarball};
  } catch (error) {
    logger(`Preparation failed; preserved files for diagnosis: ${temporaryRoot}`);
    throw error;
  }
}

if (require.main === module) {
  try {
    prepareExpoSmoke();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {prepareExpoSmoke};
