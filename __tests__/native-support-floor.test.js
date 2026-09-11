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
const {join} = require('path');
const {
  PHASES,
  SUPPORT_FLOOR,
  addTarballDependency,
  applyIosToolchainCompatibility,
  buildAndroid,
  buildIos,
  createGeneratorArgs,
  parseArgs,
  preflight,
  requireArtifact,
  resolveInstalledLibrary,
  runPhase,
  selectPlatforms,
  verifyAutolinking,
  verifyNewArchitecture,
  withNativeTemporaryDirectory,
} = require('../scripts/native-support-floor');

function withFixture(operation) {
  const directory = mkdtempSync(join(tmpdir(), 'rn-nfc-floor-test-'));
  try {
    return operation(directory);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
}

function write(path, contents = 'fixture') {
  mkdirSync(require('path').dirname(path), {recursive: true});
  writeFileSync(path, contents);
}

describe('React Native native support-floor validator', () => {
  test('pins the React Native support-floor inputs', () => {
    expect(SUPPORT_FLOOR).toMatchObject({
      appName: 'NfcSupportFloor',
      reactNative: '0.76.9',
      react: '18.3.1',
      cli: '@react-native-community/cli@15.0.1',
      nodeMajor: 22,
      javaMajor: 17,
      ruby: '3.1.2',
      cocoaPods: '1.15.2',
      ffi: '1.17.0',
      xcodeFmtPatchFromMajor: 26,
      android: {
        buildTools: '35.0.0',
        compileSdk: 35,
        targetSdk: 34,
        ndk: '26.1.10909125',
        architecture: 'arm64-v8a',
      },
    });
  });

  test('selects focused or combined platform execution', () => {
    expect(parseArgs([])).toEqual({
      platforms: ['android', 'ios'],
      keepTemporary: false,
    });
    expect(parseArgs(['--platform=android', '--keep-temp'])).toEqual({
      platforms: ['android'],
      keepTemporary: true,
    });
    expect(parseArgs(['--platform', 'ios']).platforms).toEqual(['ios']);
    expect(selectPlatforms('all')).toEqual(['android', 'ios']);
    expect(() => selectPlatforms('windows')).toThrow(
      'Expected android, ios, or all',
    );
  });

  test('constructs a pinned, installation-free consumer generator command', () => {
    expect(createGeneratorArgs('/tmp/NfcSupportFloor')).toEqual([
      'exec',
      '--yes',
      '@react-native-community/cli@15.0.1',
      '--',
      'init',
      'NfcSupportFloor',
      '--version',
      '0.76.9',
      '--directory',
      '/tmp/NfcSupportFloor',
      '--skip-install',
      '--skip-git-init',
    ]);
  });

  test('checks the pinned release toolchain without requiring a repository Gemfile', () => {
    const outputs = new Map([
      [`${process.execPath} --version`, 'v22.22.2'],
      ['java --version', 'openjdk 17.0.12'],
      ['rbenv exec ruby --version', 'ruby 3.1.2p20'],
      ['rbenv exec pod --version', '1.15.2'],
      ['rbenv exec ruby -e require "ffi"; print FFI::VERSION', '1.17.0'],
      ['xcodebuild -version', 'Xcode 26.6'],
    ]);
    const commands = [];
    const versions = preflight(['ios'], {
      exec(command, args) {
        const key = `${command} ${args.join(' ')}`;
        commands.push(key);
        return outputs.get(key);
      },
      logger() {},
    });
    expect(versions.cocoaPods).toBe('1.15.2');
    expect(commands).toContain('rbenv exec pod --version');
    expect(commands).toContain(
      'rbenv exec ruby -e require "ffi"; print FFI::VERSION',
    );
    expect(commands).not.toContain('rbenv exec bundle exec pod --version');
  });

  test('adds only an absolute packed-tarball dependency to the generated app', () =>
    withFixture((consumerDirectory) => {
      write(
        join(consumerDirectory, 'package.json'),
        JSON.stringify({
          dependencies: {react: '18.3.1', 'react-native': '0.76.9'},
        }),
      );
      addTarballDependency(consumerDirectory, '/tmp/library.tgz');
      const packageJson = JSON.parse(
        readFileSync(join(consumerDirectory, 'package.json'), 'utf8'),
      );
      expect(packageJson.dependencies['react-native-nfc-manager']).toBe(
        'file:/tmp/library.tgz',
      );
      expect(() =>
        addTarballDependency(consumerDirectory, 'library.tgz'),
      ).toThrow('packed tarball path must be absolute');
    }));

  test('verifies Android and iOS New Architecture template inputs', () =>
    withFixture((consumerDirectory) => {
      write(
        join(consumerDirectory, 'android', 'gradle.properties'),
        'newArchEnabled=true\n',
      );
      write(
        join(consumerDirectory, 'android', 'build.gradle'),
        'compileSdkVersion = 35\n',
      );
      write(
        join(consumerDirectory, 'ios', 'Podfile'),
        'prepare_react_native_project!\n',
      );
      expect(() => verifyNewArchitecture(consumerDirectory)).not.toThrow();
    }));

  test('accepts consumer-owned package and autolinking roots and rejects fallback', () =>
    withFixture((fixtureRoot) => {
      const consumerDirectory = join(fixtureRoot, 'consumer');
      const repositoryRoot = join(fixtureRoot, 'repository');
      const libraryRoot = join(
        consumerDirectory,
        'node_modules',
        'react-native-nfc-manager',
      );
      const packagePath = join(libraryRoot, 'package.json');
      write(packagePath, JSON.stringify({version: '4.0.0-beta.9'}));
      mkdirSync(repositoryRoot, {recursive: true});

      expect(
        resolveInstalledLibrary(
          consumerDirectory,
          repositoryRoot,
          () => packagePath,
        ).packageJson.version,
      ).toBe('4.0.0-beta.9');
      expect(
        verifyAutolinking(
          {
            dependencies: {
              'react-native-nfc-manager': {
                root: libraryRoot,
                platforms: {android: {}, ios: {}},
              },
            },
          },
          consumerDirectory,
          ['android', 'ios'],
        ).root,
      ).toBe(libraryRoot);

      const fallbackPath = join(repositoryRoot, 'package.json');
      write(fallbackPath, JSON.stringify({version: '4.0.0-beta.9'}));
      expect(() =>
        resolveInstalledLibrary(
          consumerDirectory,
          repositoryRoot,
          () => fallbackPath,
        ),
      ).toThrow('library resolved outside consumer node_modules');
    }));

  test('labels platform and phase failures', () => {
    expect(() =>
      runPhase(
        'ios',
        PHASES.podInstall,
        () => {
          throw new Error('podspec rejected');
        },
        () => {},
      ),
    ).toThrow(
      'Native support-floor validation failed [RN 0.76.9] [ios] [iOS pod installation]: podspec rejected',
    );
  });

  test('constructs Android assembly and verifies its APK', () =>
    withFixture((fixtureRoot) => {
      const consumerDirectory = join(fixtureRoot, 'consumer');
      const apk = join(
        consumerDirectory,
        'android',
        'app',
        'build',
        'outputs',
        'apk',
        'debug',
        'app-debug.apk',
      );
      const calls = [];
      const artifact = buildAndroid(consumerDirectory, fixtureRoot, {
        exec(command, args, options) {
          calls.push({command, args, options});
          write(apk);
        },
      });
      expect(artifact).toBe(apk);
      expect(calls[0].args).toEqual([
        ':app:assembleDebug',
        '--no-daemon',
        '-PreactNativeArchitectures=arm64-v8a',
      ]);
      expect(calls[0].options.env.GRADLE_USER_HOME).toBe(
        join(fixtureRoot, 'gradle-home'),
      );
    }));

  test('constructs pinned CocoaPods and unsigned iOS build commands', () =>
    withFixture((fixtureRoot) => {
      const consumerDirectory = join(fixtureRoot, 'consumer');
      const iosDirectory = join(consumerDirectory, 'ios');
      mkdirSync(iosDirectory, {recursive: true});
      const app = join(
        fixtureRoot,
        'ios-derived-data',
        'Build',
        'Products',
        'Debug-iphonesimulator',
        'NfcSupportFloor.app',
      );
      const calls = [];
      const artifact = buildIos(consumerDirectory, fixtureRoot, 'Xcode 25.4', {
        exec(command, args, options) {
          calls.push({command, args, options});
          if (command === 'rbenv' && args.includes('pod')) {
            write(
              join(iosDirectory, 'Podfile.lock'),
              '  - react-native-nfc-manager (4.0.0-beta.9):\n',
            );
          }
          if (command === 'xcodebuild') {
            write(join(app, 'Info.plist'));
          }
        },
        logger() {},
      });
      expect(artifact).toBe(app);
      expect(calls.map(({command}) => command)).toEqual([
        'rbenv',
        'xcodebuild',
      ]);
      expect(calls[0].args).toEqual(['exec', 'pod', '_1.15.2_', 'install']);
      expect(calls[0].options.env.BUNDLE_PATH).toBeUndefined();
      expect(calls[0].options.env.RCT_NEW_ARCH_ENABLED).toBe('1');
      expect(calls[1].args).toContain('CODE_SIGNING_ALLOWED=NO');
      expect(calls[1].args).toContain('generic/platform=iOS Simulator');
    }));

  test('applies the explicit RN 0.76 fmt workaround only for Xcode 26+', () =>
    withFixture((fixtureRoot) => {
      const iosDirectory = join(fixtureRoot, 'ios');
      const fmtHeader = join(
        iosDirectory,
        'Pods',
        'fmt',
        'include',
        'fmt',
        'base.h',
      );
      const original =
        '#elif defined(__apple_build_version__) && __apple_build_version__ < 14000029L\n' +
        '#  define FMT_USE_CONSTEVAL 0  // consteval is broken in Apple clang < 14.';
      write(fmtHeader, original);

      expect(
        applyIosToolchainCompatibility(iosDirectory, 'Xcode 25.4'),
      ).toEqual({fmtConstevalDisabled: false});
      expect(readFileSync(fmtHeader, 'utf8')).toBe(original);

      expect(
        applyIosToolchainCompatibility(iosDirectory, 'Xcode 26.6'),
      ).toMatchObject({fmtConstevalDisabled: true, fmtHeader});
      expect(readFileSync(fmtHeader, 'utf8')).toContain(
        '#elif defined(__apple_build_version__)\n',
      );
      expect(readFileSync(fmtHeader, 'utf8')).not.toContain(
        '__apple_build_version__ < 14000029L',
      );
    }));

  test('requires non-empty expected artifacts', () =>
    withFixture((fixtureRoot) => {
      const artifact = join(fixtureRoot, 'artifact');
      write(artifact, '');
      expect(() => requireArtifact(artifact, 'fixture artifact')).toThrow(
        'fixture artifact was not created',
      );
      write(artifact, 'ok');
      expect(requireArtifact(artifact, 'fixture artifact')).toBe(artifact);
    }));

  test('cleans temporary roots by default and preserves them only on request', () => {
    let cleanedDirectory;
    withNativeTemporaryDirectory(
      {keepTemporary: false},
      (directory) => {
        cleanedDirectory = directory;
      },
      {mkdtempSync, rmSync, logger() {}},
    );
    expect(existsSync(cleanedDirectory)).toBe(false);

    let preservedDirectory;
    withNativeTemporaryDirectory(
      {keepTemporary: true},
      (directory) => {
        preservedDirectory = directory;
      },
      {mkdtempSync, rmSync, logger() {}},
    );
    expect(existsSync(preservedDirectory)).toBe(true);
    rmSync(preservedDirectory, {recursive: true, force: true});
  });
});
