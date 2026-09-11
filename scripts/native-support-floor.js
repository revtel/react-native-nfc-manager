'use strict';

const {execFileSync} = require('child_process');
const {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} = require('fs');
const {tmpdir} = require('os');
const {dirname, isAbsolute, join, relative, resolve, sep} = require('path');
const {packLibrary, runCommand, runNpm} = require('./codegen-compatibility');

const SUPPORT_FLOOR = Object.freeze({
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
  android: Object.freeze({
    buildTools: '35.0.0',
    compileSdk: 35,
    targetSdk: 34,
    ndk: '26.1.10909125',
    architecture: 'arm64-v8a',
  }),
});

const PLATFORMS = Object.freeze(['android', 'ios']);

const PHASES = Object.freeze({
  toolchain: 'toolchain preflight',
  pack: 'package build and pack',
  generate: 'consumer generation',
  install: 'tarball dependency installation',
  architecture: 'New Architecture verification',
  resolution: 'installed package resolution',
  autolinking: 'native autolinking discovery',
  androidBuild: 'Android application assembly',
  podInstall: 'iOS pod installation',
  iosToolchainCompatibility: 'iOS toolchain compatibility adjustment',
  iosBuild: 'iOS application build',
});

function parseArgs(args) {
  const options = {platforms: [...PLATFORMS], keepTemporary: false};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--platform') {
      index += 1;
      if (!args[index]) {
        throw new Error('--platform requires android, ios, or all');
      }
      options.platforms = selectPlatforms(args[index]);
    } else if (argument.startsWith('--platform=')) {
      options.platforms = selectPlatforms(argument.slice('--platform='.length));
    } else if (argument === '--keep-temp') {
      options.keepTemporary = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function selectPlatforms(platform) {
  if (platform === 'all') {
    return [...PLATFORMS];
  }
  if (!PLATFORMS.includes(platform)) {
    throw new Error(
      `Unsupported platform "${platform}". Expected android, ios, or all`,
    );
  }
  return [platform];
}

function formatFailure(platform, phase, error) {
  const detail = error instanceof Error ? error.message : String(error);
  return `Native support-floor validation failed [RN ${SUPPORT_FLOOR.reactNative}] [${platform}] [${phase}]: ${detail}`;
}

function runPhase(platform, phase, operation, logger = console.log) {
  logger(`[RN ${SUPPORT_FLOOR.reactNative}] [${platform}] ${phase}...`);
  try {
    const result = operation();
    logger(`[RN ${SUPPORT_FLOOR.reactNative}] [${platform}] ${phase}: success`);
    return result;
  } catch (error) {
    throw new Error(formatFailure(platform, phase, error), {cause: error});
  }
}

function createGeneratorArgs(consumerDirectory) {
  return [
    'exec',
    '--yes',
    SUPPORT_FLOOR.cli,
    '--',
    'init',
    SUPPORT_FLOOR.appName,
    '--version',
    SUPPORT_FLOOR.reactNative,
    '--directory',
    consumerDirectory,
    '--skip-install',
    '--skip-git-init',
  ];
}

function addTarballDependency(consumerDirectory, tarballPath) {
  if (!isAbsolute(tarballPath)) {
    throw new Error('packed tarball path must be absolute');
  }
  const packagePath = join(consumerDirectory, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  if (
    packageJson.dependencies?.react !== SUPPORT_FLOOR.react ||
    packageJson.dependencies?.['react-native'] !== SUPPORT_FLOOR.reactNative
  ) {
    throw new Error(
      `generated template does not contain React ${SUPPORT_FLOOR.react} and React Native ${SUPPORT_FLOOR.reactNative}`,
    );
  }
  packageJson.dependencies['react-native-nfc-manager'] = `file:${tarballPath}`;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);
  return packageJson;
}

function requireText(path, pattern, description) {
  const contents = readFileSync(path, 'utf8');
  if (!pattern.test(contents)) {
    throw new Error(`${description} is not configured in ${path}`);
  }
  return contents;
}

function verifyNewArchitecture(consumerDirectory) {
  const gradleProperties = requireText(
    join(consumerDirectory, 'android', 'gradle.properties'),
    /^newArchEnabled=true$/m,
    'Android New Architecture',
  );
  const androidBuild = requireText(
    join(consumerDirectory, 'android', 'build.gradle'),
    /compileSdkVersion\s*=\s*35/,
    'Android compile SDK 35',
  );
  const podfile = requireText(
    join(consumerDirectory, 'ios', 'Podfile'),
    /prepare_react_native_project!\s*/,
    'iOS React Native pod preparation',
  );
  return {gradleProperties, androidBuild, podfile};
}

function isInside(candidate, parent) {
  const childPath = realpathSync(candidate);
  const parentPath = realpathSync(parent);
  const relation = relative(parentPath, childPath);
  return (
    relation !== '' && relation !== '..' && !relation.startsWith(`..${sep}`)
  );
}

function resolveInstalledLibrary(
  consumerDirectory,
  repositoryRoot,
  resolveRequest = require.resolve,
) {
  const packagePath = resolveRequest('react-native-nfc-manager/package.json', {
    paths: [consumerDirectory],
  });
  const libraryRoot = dirname(packagePath);
  const expectedNodeModules = join(consumerDirectory, 'node_modules');
  if (!isInside(libraryRoot, expectedNodeModules)) {
    throw new Error(
      `library resolved outside consumer node_modules: ${libraryRoot}`,
    );
  }
  if (isInside(libraryRoot, repositoryRoot)) {
    throw new Error(
      `library unexpectedly resolved from repository checkout: ${libraryRoot}`,
    );
  }
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  return {libraryRoot, packageJson};
}

function verifyAutolinking(config, consumerDirectory, platforms) {
  const dependency = config.dependencies?.['react-native-nfc-manager'];
  if (!dependency?.root) {
    throw new Error(
      'react-native-nfc-manager is absent from autolinking config',
    );
  }
  if (!isInside(dependency.root, join(consumerDirectory, 'node_modules'))) {
    throw new Error(
      `autolinking root is outside consumer node_modules: ${dependency.root}`,
    );
  }
  for (const platform of platforms) {
    if (!dependency.platforms?.[platform]) {
      throw new Error(`autolinking has no ${platform} configuration`);
    }
  }
  return dependency;
}

function requireArtifact(path, description) {
  if (!existsSync(path) || statSync(path).size === 0) {
    throw new Error(`${description} was not created: ${path}`);
  }
  return path;
}

function readVersion(command, args, dependencies, options = {}) {
  return runCommand(
    command,
    args,
    {capture: true, execOptions: options},
    dependencies.exec,
  ).trim();
}

function requireVersion(actual, expected, name) {
  if (!actual.includes(expected)) {
    throw new Error(`${name} ${expected} is required; found ${actual}`);
  }
}

function preflight(platforms, dependencies) {
  const versions = {
    node: readVersion(process.execPath, ['--version'], dependencies),
    java: readVersion('java', ['--version'], dependencies),
  };
  requireVersion(versions.node, `v${SUPPORT_FLOOR.nodeMajor}.`, 'Node.js');
  requireVersion(versions.java, SUPPORT_FLOOR.javaMajor.toString(), 'Java');

  if (platforms.includes('ios')) {
    versions.ruby = readVersion(
      'rbenv',
      ['exec', 'ruby', '--version'],
      dependencies,
    );
    versions.cocoaPods = readVersion(
      'rbenv',
      ['exec', 'pod', '--version'],
      dependencies,
    );
    versions.ffi = readVersion(
      'rbenv',
      ['exec', 'ruby', '-e', 'require "ffi"; print FFI::VERSION'],
      dependencies,
    );
    versions.xcode = readVersion('xcodebuild', ['-version'], dependencies);
    requireVersion(versions.ruby, SUPPORT_FLOOR.ruby, 'Ruby');
    requireVersion(versions.cocoaPods, SUPPORT_FLOOR.cocoaPods, 'CocoaPods');
    requireVersion(versions.ffi, SUPPORT_FLOOR.ffi, 'ffi');
  }

  dependencies.logger(
    `Toolchain: ${Object.entries(versions)
      .map(([name, version]) => `${name}=${version.replace(/\s+/g, ' ')}`)
      .join('; ')}`,
  );
  return versions;
}

function installConsumer(
  consumerDirectory,
  tarballPath,
  temporaryRoot,
  dependencies,
) {
  addTarballDependency(consumerDirectory, tarballPath);
  runNpm(
    ['install', '--no-audit', '--no-fund', '--package-lock=false'],
    {
      execOptions: {
        cwd: consumerDirectory,
        env: {
          ...process.env,
          npm_config_cache: join(temporaryRoot, 'npm-cache'),
        },
      },
    },
    dependencies,
  );
}

function discoverAutolinking(consumerDirectory, platforms, dependencies) {
  const cli = join(consumerDirectory, 'node_modules', '.bin', 'react-native');
  requireArtifact(cli, 'React Native CLI');
  const output = runCommand(
    cli,
    ['config'],
    {capture: true, execOptions: {cwd: consumerDirectory}},
    dependencies.exec,
  );
  return verifyAutolinking(JSON.parse(output), consumerDirectory, platforms);
}

function buildAndroid(consumerDirectory, temporaryRoot, dependencies) {
  const androidDirectory = join(consumerDirectory, 'android');
  runCommand(
    join(androidDirectory, 'gradlew'),
    [
      ':app:assembleDebug',
      '--no-daemon',
      `-PreactNativeArchitectures=${SUPPORT_FLOOR.android.architecture}`,
    ],
    {
      execOptions: {
        cwd: androidDirectory,
        env: {
          ...process.env,
          GRADLE_USER_HOME: join(temporaryRoot, 'gradle-home'),
        },
      },
    },
    dependencies.exec,
  );
  return requireArtifact(
    join(
      androidDirectory,
      'app',
      'build',
      'outputs',
      'apk',
      'debug',
      'app-debug.apk',
    ),
    'Android debug APK',
  );
}

function xcodeMajor(version) {
  const match = /^Xcode\s+(\d+)/m.exec(version);
  if (!match) {
    throw new Error(`unable to parse Xcode version: ${version}`);
  }
  return Number(match[1]);
}

function applyIosToolchainCompatibility(iosDirectory, version) {
  if (xcodeMajor(version) < SUPPORT_FLOOR.xcodeFmtPatchFromMajor) {
    return {fmtConstevalDisabled: false};
  }

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
  const patched =
    '#elif defined(__apple_build_version__)\n' +
    '#  define FMT_USE_CONSTEVAL 0  // consteval is broken in Apple clang.';
  const source = readFileSync(fmtHeader, 'utf8');

  if (source.includes(original)) {
    chmodSync(fmtHeader, statSync(fmtHeader).mode | 0o200);
    writeFileSync(fmtHeader, source.replace(original, patched));
  } else if (!source.includes(patched)) {
    throw new Error(
      `unable to apply the RN 0.76 fmt workaround; expected condition is absent from ${fmtHeader}`,
    );
  }

  return {fmtConstevalDisabled: true, fmtHeader};
}

function buildIos(
  consumerDirectory,
  temporaryRoot,
  xcodeVersion,
  dependencies,
) {
  const iosDirectory = join(consumerDirectory, 'ios');
  const bundleEnvironment = {
    ...process.env,
    COCOAPODS_DISABLE_STATS: 'true',
    RCT_NEW_ARCH_ENABLED: '1',
  };
  runPhase(
    'ios',
    PHASES.podInstall,
    () => {
      runCommand(
        'rbenv',
        ['exec', 'pod', '_1.15.2_', 'install'],
        {execOptions: {cwd: iosDirectory, env: bundleEnvironment}},
        dependencies.exec,
      );
      requireText(
        join(iosDirectory, 'Podfile.lock'),
        /^  - react-native-nfc-manager \(/m,
        'react-native-nfc-manager Pod',
      );
    },
    dependencies.logger,
  );

  runPhase(
    'ios',
    PHASES.iosToolchainCompatibility,
    () => {
      const adjustment = applyIosToolchainCompatibility(
        iosDirectory,
        xcodeVersion,
      );
      if (adjustment.fmtConstevalDisabled) {
        dependencies.logger(
          `Applied RN ${
            SUPPORT_FLOOR.reactNative
          } fmt compatibility adjustment for ${xcodeVersion.replace(
            /\s+/g,
            ' ',
          )}`,
        );
      }
      return adjustment;
    },
    dependencies.logger,
  );

  const derivedData = join(temporaryRoot, 'ios-derived-data');
  runCommand(
    'xcodebuild',
    [
      '-workspace',
      `${SUPPORT_FLOOR.appName}.xcworkspace`,
      '-scheme',
      SUPPORT_FLOOR.appName,
      '-configuration',
      'Debug',
      '-sdk',
      'iphonesimulator',
      '-destination',
      'generic/platform=iOS Simulator',
      '-derivedDataPath',
      derivedData,
      'CODE_SIGNING_ALLOWED=NO',
      'build',
    ],
    {execOptions: {cwd: iosDirectory, env: bundleEnvironment}},
    dependencies.exec,
  );
  return requireArtifact(
    join(
      derivedData,
      'Build',
      'Products',
      'Debug-iphonesimulator',
      `${SUPPORT_FLOOR.appName}.app`,
    ),
    'iOS simulator application',
  );
}

function withNativeTemporaryDirectory(options, operation, dependencies) {
  const directory = dependencies.mkdtempSync(
    join(tmpdir(), 'rn-nfc-native-floor-'),
  );
  try {
    return operation(directory);
  } finally {
    if (options.keepTemporary) {
      dependencies.logger(`Preserved temporary root: ${directory}`);
    } else {
      dependencies.rmSync(directory, {recursive: true, force: true});
    }
  }
}

function runSupportFloor(options, providedDependencies = {}) {
  const repositoryRoot =
    providedDependencies.repositoryRoot ?? resolve(__dirname, '..');
  const dependencies = {
    exec: providedDependencies.exec ?? execFileSync,
    logger: providedDependencies.logger ?? console.log,
    mkdtempSync: providedDependencies.mkdtempSync ?? mkdtempSync,
    npmExecPath: providedDependencies.npmExecPath ?? process.env.npm_execpath,
    packLibrary: providedDependencies.packLibrary ?? packLibrary,
    repositoryRoot,
    rmSync: providedDependencies.rmSync ?? rmSync,
  };

  return withNativeTemporaryDirectory(
    options,
    (temporaryRoot) => {
      dependencies.logger(`Temporary root: ${temporaryRoot}`);
      const versions = runPhase(
        'all',
        PHASES.toolchain,
        () => preflight(options.platforms, dependencies),
        dependencies.logger,
      );
      const tarballPath = runPhase(
        'all',
        PHASES.pack,
        () =>
          dependencies.packLibrary(repositoryRoot, temporaryRoot, dependencies),
        dependencies.logger,
      );
      const consumerDirectory = join(temporaryRoot, SUPPORT_FLOOR.appName);

      runPhase(
        'all',
        PHASES.generate,
        () => {
          runNpm(
            createGeneratorArgs(consumerDirectory),
            {
              execOptions: {
                cwd: temporaryRoot,
                env: {
                  ...process.env,
                  npm_config_cache: join(temporaryRoot, 'npm-cache'),
                },
              },
            },
            dependencies,
          );
        },
        dependencies.logger,
      );
      runPhase(
        'all',
        PHASES.install,
        () => {
          installConsumer(
            consumerDirectory,
            tarballPath,
            temporaryRoot,
            dependencies,
          );
        },
        dependencies.logger,
      );
      runPhase(
        'all',
        PHASES.architecture,
        () => {
          verifyNewArchitecture(consumerDirectory);
        },
        dependencies.logger,
      );
      const installed = runPhase(
        'all',
        PHASES.resolution,
        () => resolveInstalledLibrary(consumerDirectory, repositoryRoot),
        dependencies.logger,
      );
      runPhase(
        'all',
        PHASES.autolinking,
        () =>
          discoverAutolinking(
            consumerDirectory,
            options.platforms,
            dependencies,
          ),
        dependencies.logger,
      );

      const artifacts = {};
      if (options.platforms.includes('android')) {
        artifacts.android = runPhase(
          'android',
          PHASES.androidBuild,
          () => buildAndroid(consumerDirectory, temporaryRoot, dependencies),
          dependencies.logger,
        );
      }
      if (options.platforms.includes('ios')) {
        artifacts.ios = runPhase(
          'ios',
          PHASES.iosBuild,
          () =>
            buildIos(
              consumerDirectory,
              temporaryRoot,
              versions.xcode,
              dependencies,
            ),
          dependencies.logger,
        );
      }

      return {
        artifacts,
        installedVersion: installed.packageJson.version,
        platforms: [...options.platforms],
        tarball: tarballPath,
        temporaryRoot,
        versions,
      };
    },
    dependencies,
  );
}

module.exports = {
  PHASES,
  PLATFORMS,
  SUPPORT_FLOOR,
  addTarballDependency,
  applyIosToolchainCompatibility,
  buildAndroid,
  buildIos,
  createGeneratorArgs,
  formatFailure,
  isInside,
  parseArgs,
  preflight,
  requireArtifact,
  requireVersion,
  resolveInstalledLibrary,
  runPhase,
  runSupportFloor,
  selectPlatforms,
  verifyAutolinking,
  verifyNewArchitecture,
  withNativeTemporaryDirectory,
};
