'use strict';

const {execFileSync, spawnSync} = require('child_process');
const {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} = require('fs');
const {tmpdir} = require('os');
const {dirname, isAbsolute, join, relative, resolve, sep} = require('path');
const plist = require('@expo/plist').default;
const {packLibrary, runCommand, runNpm} = require('./codegen-compatibility');

const EXPO_CONSUMER = Object.freeze({
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
  bundleIdentifier: 'com.revteltech.nfcexpoconsumer',
  nfcPermission: 'Scan nearby NFC tags',
  selectIdentifier: 'A0000002471001',
  systemCode: '8008',
});

const PLATFORMS = Object.freeze(['android', 'ios']);

const PHASES = Object.freeze({
  toolchain: 'toolchain preflight',
  pack: 'package build and pack',
  generate: 'Expo consumer generation',
  install: 'tarball dependency installation',
  prebuild: 'Expo native prebuild',
  doctor: 'Expo Doctor',
  configuration: 'generated configuration verification',
  provenance: 'package provenance and autolinking verification',
  androidBuild: 'Android application assembly',
  podInstall: 'iOS pod installation',
  iosBuild: 'iOS application build',
});

function selectPlatforms(platform) {
  if (platform === 'all') {
    return [...PLATFORMS];
  }
  if (platform === 'config') {
    return [];
  }
  if (!PLATFORMS.includes(platform)) {
    throw new Error(
      `Unsupported platform "${platform}". Expected config, android, ios, or all`,
    );
  }
  return [platform];
}

function parseArgs(args) {
  const options = {platforms: [...PLATFORMS], keepTemporary: false};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--platform') {
      index += 1;
      if (!args[index]) {
        throw new Error('--platform requires config, android, ios, or all');
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

function formatFailure(platform, phase, error) {
  const detail = error instanceof Error ? error.message : String(error);
  return `Expo consumer validation failed [Expo ${EXPO_CONSUMER.expo}] [${platform}] [${phase}]: ${detail}`;
}

function runPhase(platform, phase, operation, logger = console.log) {
  logger(`[Expo ${EXPO_CONSUMER.expo}] [${platform}] ${phase}...`);
  try {
    const result = operation();
    logger(`[Expo ${EXPO_CONSUMER.expo}] [${platform}] ${phase}: success`);
    return result;
  } catch (error) {
    throw new Error(formatFailure(platform, phase, error), {cause: error});
  }
}

function requireVersion(actual, expected, name) {
  if (!actual.includes(expected)) {
    throw new Error(`${name} ${expected} is required; found ${actual}`);
  }
}

function readVersion(command, args, dependencies, options = {}) {
  return runCommand(
    command,
    args,
    {capture: true, execOptions: options},
    dependencies.exec,
  ).trim();
}

function preflight(platforms, dependencies) {
  const versions = {
    node: readVersion(process.execPath, ['--version'], dependencies),
  };
  requireVersion(versions.node, `v${EXPO_CONSUMER.nodeMajor}.`, 'Node.js');

  if (platforms.includes('android')) {
    versions.java = readVersion('java', ['--version'], dependencies);
    requireVersion(
      versions.java,
      EXPO_CONSUMER.javaMajor.toString(),
      'Java',
    );
  }

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
    versions.xcode = readVersion('xcodebuild', ['-version'], dependencies);
    requireVersion(versions.ruby, EXPO_CONSUMER.ruby, 'Ruby');
    requireVersion(
      versions.cocoaPods,
      EXPO_CONSUMER.cocoaPods,
      'CocoaPods',
    );
  }
  return versions;
}

function createGeneratorArgs(consumerDirectory) {
  return [
    'exec',
    '--yes',
    EXPO_CONSUMER.createExpoApp,
    '--',
    consumerDirectory,
    '--template',
    'blank-typescript',
    '--no-install',
    '--yes',
  ];
}

function configureConsumer(consumerDirectory, tarballPath) {
  if (!isAbsolute(tarballPath)) {
    throw new Error('packed tarball path must be absolute');
  }
  const packagePath = join(consumerDirectory, 'package.json');
  const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
  const expectedDependencies = {
    expo: `~${EXPO_CONSUMER.expo}`,
    react: EXPO_CONSUMER.react,
    'react-native': EXPO_CONSUMER.reactNative,
  };
  for (const [name, version] of Object.entries(expectedDependencies)) {
    if (packageJson.dependencies?.[name] !== version) {
      throw new Error(
        `generated Expo template expected ${name} ${version}; found ${packageJson.dependencies?.[name]}`,
      );
    }
  }
  packageJson.dependencies['react-native-nfc-manager'] = `file:${tarballPath}`;
  writeFileSync(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const appConfig = {
    expo: {
      name: EXPO_CONSUMER.appName,
      slug: 'nfc-expo-consumer',
      version: '1.0.0',
      ios: {
        bundleIdentifier: EXPO_CONSUMER.bundleIdentifier,
        supportsTablet: true,
      },
      android: {package: EXPO_CONSUMER.bundleIdentifier},
      plugins: [
        [
          'react-native-nfc-manager',
          {
            nfcPermission: EXPO_CONSUMER.nfcPermission,
            includeNdefEntitlement: true,
            selectIdentifiers: [
              EXPO_CONSUMER.selectIdentifier,
              EXPO_CONSUMER.selectIdentifier,
            ],
            systemCodes: [
              EXPO_CONSUMER.systemCode,
              EXPO_CONSUMER.systemCode,
            ],
          },
        ],
      ],
    },
  };
  writeFileSync(
    join(consumerDirectory, 'app.json'),
    `${JSON.stringify(appConfig, null, 2)}\n`,
  );
  return packageJson;
}

function requireText(path, pattern, description) {
  const contents = readFileSync(path, 'utf8');
  if (!pattern.test(contents)) {
    throw new Error(`${description} is not configured in ${path}`);
  }
  return contents;
}

function requireArtifact(path, description) {
  if (!existsSync(path)) {
    throw new Error(`${description} was not created: ${path}`);
  }
  const stats = statSync(path);
  if (stats.isFile() && stats.size === 0) {
    throw new Error(`${description} is empty: ${path}`);
  }
  return path;
}

function count(values, expected) {
  return values.filter((value) => value === expected).length;
}

function verifyGeneratedConfiguration(consumerDirectory) {
  const iosRoot = join(consumerDirectory, 'ios', EXPO_CONSUMER.appName);
  const infoPlist = plist.parse(
    readFileSync(join(iosRoot, 'Info.plist'), 'utf8'),
  );
  const entitlements = plist.parse(
    readFileSync(
      join(iosRoot, `${EXPO_CONSUMER.appName}.entitlements`),
      'utf8',
    ),
  );
  if (infoPlist.NFCReaderUsageDescription !== EXPO_CONSUMER.nfcPermission) {
    throw new Error('custom iOS NFC usage description is absent');
  }
  const identifiers =
    infoPlist[
      'com.apple.developer.nfc.readersession.iso7816.select-identifiers'
    ] ?? [];
  const systemCodes =
    infoPlist['com.apple.developer.nfc.readersession.felica.systemcodes'] ?? [];
  if (count(identifiers, EXPO_CONSUMER.selectIdentifier) !== 1) {
    throw new Error('ISO 7816 select identifier is absent or duplicated');
  }
  if (count(systemCodes, EXPO_CONSUMER.systemCode) !== 1) {
    throw new Error('FeliCa system code is absent or duplicated');
  }
  const formats =
    entitlements['com.apple.developer.nfc.readersession.formats'] ?? [];
  if (!formats.includes('NDEF') || !formats.includes('TAG')) {
    throw new Error('iOS NDEF and TAG reader-session formats are required');
  }

  const manifest = requireText(
    join(consumerDirectory, 'android', 'app', 'src', 'main', 'AndroidManifest.xml'),
    /android\.permission\.NFC/,
    'Android NFC permission',
  );
  requireText(
    join(consumerDirectory, 'android', 'gradle.properties'),
    /^newArchEnabled=true$/m,
    'Android New Architecture',
  );
  return {entitlements, formats, identifiers, infoPlist, manifest, systemCodes};
}

function isInside(candidate, parent) {
  const childPath = realpathSync(candidate);
  const parentPath = realpathSync(parent);
  const relation = relative(parentPath, childPath);
  return relation !== '' && relation !== '..' && !relation.startsWith(`..${sep}`);
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
  if (!isInside(libraryRoot, join(consumerDirectory, 'node_modules'))) {
    throw new Error(`library resolved outside consumer node_modules: ${libraryRoot}`);
  }
  if (isInside(libraryRoot, repositoryRoot)) {
    throw new Error(`library unexpectedly resolved from checkout: ${libraryRoot}`);
  }
  return {
    libraryRoot,
    packageJson: JSON.parse(readFileSync(packagePath, 'utf8')),
  };
}

function verifyConfigPluginVersions(tree) {
  const versions = new Set();
  function visit(node) {
    if (!node || typeof node !== 'object') {
      return;
    }
    const plugin = node.dependencies?.['@expo/config-plugins'];
    if (plugin?.version) {
      versions.add(plugin.version);
    }
    for (const dependency of Object.values(node.dependencies ?? {})) {
      visit(dependency);
    }
  }
  visit(tree);
  if (versions.size !== 1) {
    throw new Error(
      `expected one host-owned @expo/config-plugins version; found ${
        [...versions].join(', ') || 'none'
      }`,
    );
  }
  return [...versions][0];
}

function verifyAutolinkingOutput(output, platform) {
  const config = JSON.parse(output);
  const dependency = config.dependencies?.['react-native-nfc-manager'];
  if (!dependency?.root) {
    throw new Error(`Expo autolinking omitted react-native-nfc-manager on ${platform}`);
  }
  if (!dependency.platforms?.[platform]) {
    throw new Error(`Expo autolinking has no ${platform} platform entry`);
  }
  return dependency;
}

function runExpoDoctor(consumerDirectory, dependencies) {
  try {
    return runNpm(
      ['exec', '--yes', EXPO_CONSUMER.expoDoctor, '--'],
      {capture: true, execOptions: {cwd: consumerDirectory}},
      dependencies,
    );
  } catch (error) {
    const output = `${error.message}\n${error.cause?.stdout ?? ''}\n${
      error.cause?.stderr ?? ''
    }`;
    const acceptedMetadataWarning =
      /react-native-nfc-manager/.test(output) &&
      /Untested on New Architecture/.test(output) &&
      /1 check failed/.test(output);
    if (!acceptedMetadataWarning) {
      throw error;
    }
    dependencies.logger(
      'Expo Doctor reported only the accepted React Native Directory New Architecture metadata warning.',
    );
    return output;
  }
}

function buildAndroid(consumerDirectory, dependencies) {
  const androidDirectory = join(consumerDirectory, 'android');
  runCommand(
    './gradlew',
    [
      ':app:assembleDebug',
      '--no-daemon',
      `-PreactNativeArchitectures=${EXPO_CONSUMER.androidArchitecture}`,
    ],
    {execOptions: {cwd: androidDirectory}},
    dependencies.exec,
  );
  return requireArtifact(
    join(androidDirectory, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
    'Android debug APK',
  );
}

function installIosPods(consumerDirectory, dependencies) {
  const iosDirectory = join(consumerDirectory, 'ios');
  const environment = {
    ...process.env,
    COCOAPODS_DISABLE_STATS: 'true',
    RCT_NEW_ARCH_ENABLED: '1',
  };
  runCommand(
    'rbenv',
    ['exec', 'pod', `_${EXPO_CONSUMER.cocoaPods}_`, 'install'],
    {execOptions: {cwd: iosDirectory, env: environment}},
    dependencies.exec,
  );
  requireText(
    join(iosDirectory, 'Podfile.lock'),
    /^  - react-native-nfc-manager \(/m,
    'react-native-nfc-manager Pod',
  );
  return environment;
}

function buildIos(consumerDirectory, temporaryRoot, dependencies) {
  const iosDirectory = join(consumerDirectory, 'ios');
  const environment = {
    ...process.env,
    COCOAPODS_DISABLE_STATS: 'true',
    RCT_NEW_ARCH_ENABLED: '1',
  };
  const derivedData = join(temporaryRoot, 'ios-derived-data');
  const result = dependencies.spawn(
    'xcodebuild',
    [
      '-quiet',
      '-workspace',
      `${EXPO_CONSUMER.appName}.xcworkspace`,
      '-scheme',
      EXPO_CONSUMER.appName,
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
    {cwd: iosDirectory, encoding: 'utf8', env: environment},
  );
  const buildOutput = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  if (result.status !== 0) {
    throw new Error(`xcodebuild failed (${result.status})\n${buildOutput.trim()}`);
  }
  if (
    /NfcManager\.mm.*conflicting parameter types/i.test(buildOutput) ||
    /NfcManager.*does not conform to protocol.*NativeNfcManagerSpec/i.test(
      buildOutput,
    )
  ) {
    const details = buildOutput
      .split('\n')
      .filter((line) => /NfcManager.*(?:conflicting|does not conform)/i.test(line))
      .slice(0, 10)
      .join('\n');
    throw new Error(`NFC TurboModule protocol warning detected\n${details}`);
  }
  return requireArtifact(
    join(
      derivedData,
      'Build',
      'Products',
      'Debug-iphonesimulator',
      `${EXPO_CONSUMER.appName}.app`,
    ),
    'iOS simulator application',
  );
}

function withExpoTemporaryDirectory(options, operation, dependencies) {
  const directory = dependencies.mkdtempSync(join(tmpdir(), 'rn-nfc-expo-'));
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

function runExpoConsumer(options, providedDependencies = {}) {
  const repositoryRoot =
    providedDependencies.repositoryRoot ?? resolve(__dirname, '..');
  const dependencies = {
    exec: providedDependencies.exec ?? execFileSync,
    logger: providedDependencies.logger ?? console.log,
    mkdtempSync: providedDependencies.mkdtempSync ?? mkdtempSync,
    packLibrary: providedDependencies.packLibrary ?? packLibrary,
    repositoryRoot,
    rmSync: providedDependencies.rmSync ?? rmSync,
    spawn: providedDependencies.spawn ?? spawnSync,
  };

  return withExpoTemporaryDirectory(
    options,
    (temporaryRoot) => {
      dependencies.logger(`Temporary root: ${temporaryRoot}`);
      runPhase(
        'all',
        PHASES.toolchain,
        () => preflight(options.platforms, dependencies),
        dependencies.logger,
      );
      const tarballPath = runPhase(
        'all',
        PHASES.pack,
        () => dependencies.packLibrary(repositoryRoot, temporaryRoot, dependencies),
        dependencies.logger,
      );
      const consumerDirectory = join(temporaryRoot, EXPO_CONSUMER.appName);
      runPhase(
        'all',
        PHASES.generate,
        () =>
          runNpm(
            createGeneratorArgs(consumerDirectory),
            {execOptions: {cwd: temporaryRoot}},
            dependencies,
          ),
        dependencies.logger,
      );
      runPhase(
        'all',
        PHASES.install,
        () => {
          configureConsumer(consumerDirectory, tarballPath);
          return runNpm(
            ['install'],
            {execOptions: {cwd: consumerDirectory}},
            dependencies,
          );
        },
        dependencies.logger,
      );
      runPhase(
        'all',
        PHASES.prebuild,
        () =>
          runNpm(
            ['exec', 'expo', '--', 'prebuild', '--clean', '--no-install'],
            {execOptions: {cwd: consumerDirectory}},
            dependencies,
          ),
        dependencies.logger,
      );
      runPhase(
        'all',
        PHASES.doctor,
        () => runExpoDoctor(consumerDirectory, dependencies),
        dependencies.logger,
      );
      const configuration = runPhase(
        'all',
        PHASES.configuration,
        () => verifyGeneratedConfiguration(consumerDirectory),
        dependencies.logger,
      );
      const provenance = runPhase(
        'all',
        PHASES.provenance,
        () => {
          const library = resolveInstalledLibrary(
            consumerDirectory,
            repositoryRoot,
          );
          const dependencyTree = JSON.parse(
            runNpm(
              ['ls', '@expo/config-plugins', '--json', '--all'],
              {capture: true, execOptions: {cwd: consumerDirectory}},
              dependencies,
            ),
          );
          const configPluginVersion = verifyConfigPluginVersions(dependencyTree);
          const autolinking = {};
          for (const platform of PLATFORMS) {
            const output = runNpm(
              [
                'exec',
                'expo-modules-autolinking',
                '--',
                'react-native-config',
                '--platform',
                platform,
                '--json',
              ],
              {capture: true, execOptions: {cwd: consumerDirectory}},
              dependencies,
            );
            autolinking[platform] = verifyAutolinkingOutput(output, platform);
          }
          return {autolinking, configPluginVersion, library};
        },
        dependencies.logger,
      );

      const artifacts = {};
      if (options.platforms.includes('android')) {
        artifacts.android = runPhase(
          'android',
          PHASES.androidBuild,
          () => buildAndroid(consumerDirectory, dependencies),
          dependencies.logger,
        );
      }
      if (options.platforms.includes('ios')) {
        runPhase(
          'ios',
          PHASES.podInstall,
          () => installIosPods(consumerDirectory, dependencies),
          dependencies.logger,
        );
        artifacts.ios = runPhase(
          'ios',
          PHASES.iosBuild,
          () => buildIos(consumerDirectory, temporaryRoot, dependencies),
          dependencies.logger,
        );
      }
      dependencies.logger(
        'Expo prebuild/native compilation is not EAS Build or physical-device NFC evidence.',
      );
      return {artifacts, configuration, consumerDirectory, provenance};
    },
    dependencies,
  );
}

module.exports = {
  EXPO_CONSUMER,
  PHASES,
  buildAndroid,
  buildIos,
  configureConsumer,
  createGeneratorArgs,
  formatFailure,
  installIosPods,
  parseArgs,
  preflight,
  requireArtifact,
  resolveInstalledLibrary,
  runExpoConsumer,
  runPhase,
  selectPlatforms,
  verifyAutolinkingOutput,
  verifyConfigPluginVersions,
  verifyGeneratedConfiguration,
  withExpoTemporaryDirectory,
};
