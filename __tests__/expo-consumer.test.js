'use strict';

const {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} = require('fs');
const {tmpdir} = require('os');
const {dirname, join} = require('path');
const plist = require('@expo/plist').default;
const {
  EXPO_CONSUMER,
  PHASES,
  configureConsumer,
  createGeneratorArgs,
  parseArgs,
  preflight,
  resolveInstalledLibrary,
  runPhase,
  selectPlatforms,
  verifyAutolinkingOutput,
  verifyConfigPluginVersions,
  verifyGeneratedConfiguration,
  withExpoTemporaryDirectory,
} = require('../scripts/expo-consumer');

function withFixture(operation) {
  const directory = mkdtempSync(join(tmpdir(), 'rn-nfc-expo-test-'));
  try {
    return operation(directory);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
}

function write(path, contents) {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, contents);
}

describe('Expo consumer validator', () => {
  test('pins a current New Architecture Expo consumer', () => {
    expect(EXPO_CONSUMER).toMatchObject({
      appName: 'NfcExpoConsumer',
      createExpoApp: 'create-expo-app@4.0.0',
      expo: '57.0.21',
      expoDoctor: 'expo-doctor@1.20.4',
      react: '19.2.3',
      reactNative: '0.86.3',
      nodeMajor: 22,
      javaMajor: 17,
      ruby: '3.1.2',
      cocoaPods: '1.15.2',
      androidArchitecture: 'arm64-v8a',
    });
  });

  test('selects configuration-only or native platform phases', () => {
    expect(parseArgs([])).toEqual({
      platforms: ['android', 'ios'],
      keepTemporary: false,
    });
    expect(parseArgs(['--platform=config'])).toEqual({
      platforms: [],
      keepTemporary: false,
    });
    expect(parseArgs(['--platform', 'android', '--keep-temp'])).toEqual({
      platforms: ['android'],
      keepTemporary: true,
    });
    expect(selectPlatforms('ios')).toEqual(['ios']);
    expect(() => selectPlatforms('web')).toThrow(
      'Expected config, android, ios, or all',
    );
  });

  test('constructs a pinned installation-free Expo generator command', () => {
    expect(createGeneratorArgs('/tmp/NfcExpoConsumer')).toEqual([
      'exec',
      '--yes',
      'create-expo-app@4.0.0',
      '--',
      '/tmp/NfcExpoConsumer',
      '--template',
      'blank-typescript',
      '--no-install',
      '--yes',
    ]);
  });

  test('keeps configuration-only preflight independent of native toolchains', () => {
    const commands = [];
    const versions = preflight([], {
      exec(command, args) {
        commands.push(`${command} ${args.join(' ')}`);
        return 'v22.22.2';
      },
    });

    expect(versions.node).toBe('v22.22.2');
    expect(commands).toEqual([`${process.execPath} --version`]);
  });

  test('adds the tarball and representative plugin configuration', () =>
    withFixture((consumerDirectory) => {
      write(
        join(consumerDirectory, 'package.json'),
        JSON.stringify({
          dependencies: {
            expo: '~57.0.21',
            react: '19.2.3',
            'react-native': '0.86.3',
          },
        }),
      );
      configureConsumer(consumerDirectory, '/tmp/library.tgz');

      const packageJson = JSON.parse(
        readFileSync(join(consumerDirectory, 'package.json'), 'utf8'),
      );
      const appJson = JSON.parse(
        readFileSync(join(consumerDirectory, 'app.json'), 'utf8'),
      );
      expect(packageJson.dependencies['react-native-nfc-manager']).toBe(
        'file:/tmp/library.tgz',
      );
      expect(appJson.expo.newArchEnabled).toBeUndefined();
      expect(appJson.expo.plugins[0][1]).toMatchObject({
        nfcPermission: 'Scan nearby NFC tags',
        includeNdefEntitlement: true,
      });
      expect(() => configureConsumer(consumerDirectory, 'library.tgz')).toThrow(
        'must be absolute',
      );
    }));

  test('asserts generated iOS and Android configuration', () =>
    withFixture((consumerDirectory) => {
      const iosRoot = join(
        consumerDirectory,
        'ios',
        EXPO_CONSUMER.appName,
      );
      write(
        join(iosRoot, 'Info.plist'),
        plist.build({
          NFCReaderUsageDescription: EXPO_CONSUMER.nfcPermission,
          'com.apple.developer.nfc.readersession.iso7816.select-identifiers': [
            EXPO_CONSUMER.selectIdentifier,
          ],
          'com.apple.developer.nfc.readersession.felica.systemcodes': [
            EXPO_CONSUMER.systemCode,
          ],
        }),
      );
      write(
        join(iosRoot, `${EXPO_CONSUMER.appName}.entitlements`),
        plist.build({
          'com.apple.developer.nfc.readersession.formats': ['NDEF', 'TAG'],
        }),
      );
      write(
        join(
          consumerDirectory,
          'android',
          'app',
          'src',
          'main',
          'AndroidManifest.xml',
        ),
        '<uses-permission android:name="android.permission.NFC" />',
      );
      write(
        join(consumerDirectory, 'android', 'gradle.properties'),
        'newArchEnabled=true\n',
      );

      const result = verifyGeneratedConfiguration(consumerDirectory);
      expect(result.formats).toEqual(['NDEF', 'TAG']);
      expect(result.identifiers).toEqual([EXPO_CONSUMER.selectIdentifier]);
      expect(result.systemCodes).toEqual([EXPO_CONSUMER.systemCode]);
    }));

  test('accepts only consumer-installed package provenance', () =>
    withFixture((fixtureRoot) => {
      const consumer = join(fixtureRoot, 'consumer');
      const repository = join(fixtureRoot, 'repository');
      const packagePath = join(
        consumer,
        'node_modules',
        'react-native-nfc-manager',
        'package.json',
      );
      mkdirSync(repository, {recursive: true});
      write(packagePath, JSON.stringify({version: '4.0.0-beta.9'}));

      expect(
        resolveInstalledLibrary(consumer, repository, () => packagePath)
          .packageJson.version,
      ).toBe('4.0.0-beta.9');
      expect(() =>
        resolveInstalledLibrary(
          consumer,
          repository,
          () => join(repository, 'package.json'),
        ),
      ).toThrow();
    }));

  test('requires one host-owned config-plugin version', () => {
    const tree = {
      dependencies: {
        expo: {
          dependencies: {'@expo/config-plugins': {version: '57.0.9'}},
        },
        'react-native-nfc-manager': {
          dependencies: {'@expo/config-plugins': {version: '57.0.9'}},
        },
      },
    };
    expect(verifyConfigPluginVersions(tree)).toBe('57.0.9');
    tree.dependencies['react-native-nfc-manager'].dependencies[
      '@expo/config-plugins'
    ].version = '10.0.2';
    expect(() => verifyConfigPluginVersions(tree)).toThrow(
      'expected one host-owned',
    );
  });

  test('verifies Expo autolinking output for each platform', () => {
    const output = JSON.stringify({
      dependencies: {
        'react-native-nfc-manager': {
          root: '/tmp/consumer/node_modules/react-native-nfc-manager',
          platforms: {android: {}, ios: {}},
        },
      },
    });
    expect(verifyAutolinkingOutput(output, 'android').root).toContain(
      'react-native-nfc-manager',
    );
    expect(() =>
      verifyAutolinkingOutput(JSON.stringify({dependencies: {}}), 'ios'),
    ).toThrow('omitted');
  });

  test('labels Expo version, platform, and phase failures', () => {
    expect(() =>
      runPhase(
        'ios',
        PHASES.iosBuild,
        () => {
          throw new Error('protocol mismatch');
        },
        () => {},
      ),
    ).toThrow(
      'Expo consumer validation failed [Expo 57.0.21] [ios] [iOS application build]: protocol mismatch',
    );
  });

  test('cleans temporary roots on success and failure unless retained', () => {
    const removed = [];
    const dependencies = {
      logger() {},
      mkdtempSync: () => '/tmp/rn-nfc-expo-owned',
      rmSync: (path) => removed.push(path),
    };
    withExpoTemporaryDirectory(
      {keepTemporary: false},
      () => 'ok',
      dependencies,
    );
    expect(removed).toEqual(['/tmp/rn-nfc-expo-owned']);

    expect(() =>
      withExpoTemporaryDirectory(
        {keepTemporary: false},
        () => {
          throw new Error('failed');
        },
        dependencies,
      ),
    ).toThrow('failed');
    expect(removed).toHaveLength(2);

    withExpoTemporaryDirectory(
      {keepTemporary: true},
      () => undefined,
      dependencies,
    );
    expect(removed).toHaveLength(2);
    expect(existsSync('/tmp/rn-nfc-expo-owned')).toBe(false);
  });
});
