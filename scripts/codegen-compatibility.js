'use strict';

const {execFileSync} = require('child_process');
const {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} = require('fs');
const {tmpdir} = require('os');
const {dirname, join, resolve} = require('path');

const MATRIX = Object.freeze([
  Object.freeze({
    reactNative: '0.76.9',
    react: '18.3.1',
    role: 'support floor',
  }),
  Object.freeze({
    reactNative: '0.77.3',
    react: '18.3.1',
    role: 'EventEmitter regression line',
  }),
  Object.freeze({
    reactNative: '0.84.0',
    react: '19.2.3',
    role: 'development baseline',
  }),
]);

const PHASES = Object.freeze({
  install: 'dependency installation',
  discovery: 'library discovery',
  androidSchema: 'Android schema parsing',
  androidGeneration: 'Android generation',
  iosSchema: 'iOS schema parsing',
  iosGeneration: 'iOS generation',
  regression: 'RN 0.77.3 beta.8 regression',
});

function parseArgs(args) {
  const options = {version: null, assertBeta8Regression: false};

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--version') {
      index += 1;
      if (!args[index]) {
        throw new Error('--version requires an exact React Native version');
      }
      options.version = args[index];
    } else if (argument.startsWith('--version=')) {
      options.version = argument.slice('--version='.length);
    } else if (argument === '--assert-beta8-regression') {
      options.assertBeta8Regression = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  return options;
}

function selectMatrix(version, matrix = MATRIX) {
  if (!version) {
    return [...matrix];
  }

  const entry = matrix.find((candidate) => candidate.reactNative === version);
  if (!entry) {
    throw new Error(
      `Unsupported React Native version "${version}". Expected one of: ${matrix
        .map((candidate) => candidate.reactNative)
        .join(', ')}`,
    );
  }
  return [entry];
}

function formatFailure(entry, phase, error) {
  const detail = error instanceof Error ? error.message : String(error);
  return `Codegen compatibility failed [RN ${entry.reactNative}] [${phase}]: ${detail}`;
}

function runPhase(entry, phase, operation, logger = console.log) {
  logger(`[RN ${entry.reactNative}] ${phase}...`);
  try {
    const result = operation();
    logger(`[RN ${entry.reactNative}] ${phase}: success`);
    return result;
  } catch (error) {
    throw new Error(formatFailure(entry, phase, error), {cause: error});
  }
}

function npmInvocation(args, npmExecPath = process.env.npm_execpath) {
  if (npmExecPath) {
    return {command: process.execPath, args: [npmExecPath, ...args]};
  }
  return {command: process.platform === 'win32' ? 'npm.cmd' : 'npm', args};
}

function runCommand(command, args, options = {}, exec = execFileSync) {
  try {
    return exec(command, args, {
      encoding: 'utf8',
      stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
      ...options.execOptions,
    });
  } catch (error) {
    const output = [error.stdout, error.stderr]
      .filter(Boolean)
      .map(String)
      .join('\n')
      .trim();
    const status = error.status == null ? 'unknown' : error.status;
    const suffix = output ? `\n${output}` : '';
    throw new Error(
      `Command failed (${status}): ${command} ${args.join(' ')}${suffix}`,
      {cause: error},
    );
  }
}

function runNpm(args, options = {}, dependencies = {}) {
  const invocation = npmInvocation(args, dependencies.npmExecPath);
  return runCommand(
    invocation.command,
    invocation.args,
    options,
    dependencies.exec,
  );
}

function withTemporaryDirectory(
  prefix,
  operation,
  dependencies = {mkdtempSync, rmSync},
) {
  const directory = dependencies.mkdtempSync(join(tmpdir(), prefix));
  try {
    return operation(directory);
  } finally {
    dependencies.rmSync(directory, {recursive: true, force: true});
  }
}

function listFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });
}

function requireNonEmptyOutput(outputDirectory, platform) {
  const files = listFiles(outputDirectory).filter(
    (path) => statSync(path).size > 0,
  );
  if (files.length === 0) {
    throw new Error(`${platform} Codegen produced no non-empty artifacts`);
  }
  return files;
}

function resolveFromConsumer(request, consumerDirectory) {
  return require.resolve(request, {paths: [consumerDirectory]});
}

function discoverCodegen(consumerDirectory) {
  const reactNativePackage = resolveFromConsumer(
    'react-native/package.json',
    consumerDirectory,
  );
  const reactNativeRoot = dirname(reactNativePackage);
  const libraryPackage = resolveFromConsumer(
    'react-native-nfc-manager/package.json',
    consumerDirectory,
  );
  const libraryRoot = dirname(libraryPackage);
  const libraryJson = JSON.parse(readFileSync(libraryPackage, 'utf8'));
  const config = libraryJson.codegenConfig;

  if (!config || config.type !== 'modules' || !config.name || !config.jsSrcsDir) {
    throw new Error('installed library has no valid modules codegenConfig');
  }

  const sourceDirectory = resolve(libraryRoot, config.jsSrcsDir);
  if (!existsSync(sourceDirectory)) {
    throw new Error(`installed Codegen source is missing: ${sourceDirectory}`);
  }

  const combineScript = resolveFromConsumer(
    '@react-native/codegen/lib/cli/combine/combine-js-to-schema-cli.js',
    reactNativeRoot,
  );
  const generateScript = join(
    reactNativeRoot,
    'scripts',
    'generate-specs-cli.js',
  );
  if (!existsSync(generateScript)) {
    throw new Error(`React Native Codegen generator is missing: ${generateScript}`);
  }

  return {
    combineScript,
    config,
    generateScript,
    libraryRoot,
    sourceDirectory,
  };
}

function generatePlatform({
  consumerDirectory,
  entry,
  platform,
  tools,
  workingDirectory,
  dependencies,
}) {
  const schemaPath = join(workingDirectory, `${platform}-schema.json`);
  const outputDirectory = join(workingDirectory, `${platform}-generated`);
  const schemaPhase =
    platform === 'android' ? PHASES.androidSchema : PHASES.iosSchema;
  const generationPhase =
    platform === 'android'
      ? PHASES.androidGeneration
      : PHASES.iosGeneration;

  runPhase(entry, schemaPhase, () => {
    runCommand(
      process.execPath,
      [
        tools.combineScript,
        schemaPath,
        tools.sourceDirectory,
        '--platform',
        platform,
        '--libraryName',
        tools.config.name,
      ],
      {execOptions: {cwd: consumerDirectory}},
      dependencies.exec,
    );
    if (!existsSync(schemaPath) || statSync(schemaPath).size === 0) {
      throw new Error(`${platform} schema was not created`);
    }
  }, dependencies.logger);

  return runPhase(entry, generationPhase, () => {
    mkdirSync(outputDirectory, {recursive: true});
    runCommand(
      process.execPath,
      [
        tools.generateScript,
        '--platform',
        platform,
        '--schemaPath',
        schemaPath,
        '--outputDir',
        outputDirectory,
        '--libraryName',
        tools.config.name,
        '--javaPackageName',
        tools.config.android?.javaPackageName ?? 'community.revteltech.nfc',
        '--libraryType',
        tools.config.type,
      ],
      {execOptions: {cwd: consumerDirectory}},
      dependencies.exec,
    );
    return requireNonEmptyOutput(outputDirectory, platform);
  }, dependencies.logger);
}

function makeBeta8QualifiedSpec(currentSpec) {
  const directImports =
    "import type {TurboModule} from 'react-native';\n" +
    "import type {EventEmitter} from 'react-native/Libraries/Types/CodegenTypes';";
  if (!currentSpec.includes(directImports)) {
    throw new Error('current spec does not contain the expected direct EventEmitter imports');
  }

  return currentSpec
    .replace(
      directImports,
      "import type {CodegenTypes, TurboModule} from 'react-native';",
    )
    .replace(/\bEventEmitter</g, 'CodegenTypes.EventEmitter<');
}

function assertBeta8Regression({
  consumerDirectory,
  entry,
  tools,
  workingDirectory,
  dependencies,
}) {
  if (entry.reactNative !== '0.77.3') {
    return;
  }

  runPhase(entry, PHASES.regression, () => {
    const currentSpecPath = join(tools.sourceDirectory, 'NativeNfcManager.ts');
    const fixtureDirectory = join(workingDirectory, 'beta8-specs');
    const fixturePath = join(fixtureDirectory, 'NativeNfcManager.ts');
    const schemaPath = join(workingDirectory, 'beta8-schema.json');
    mkdirSync(fixtureDirectory, {recursive: true});
    writeFileSync(
      fixturePath,
      makeBeta8QualifiedSpec(readFileSync(currentSpecPath, 'utf8')),
    );

    try {
      runCommand(
        process.execPath,
        [
          tools.combineScript,
          schemaPath,
          fixtureDirectory,
          '--platform',
          'ios',
          '--libraryName',
          tools.config.name,
        ],
        {capture: true, execOptions: {cwd: consumerDirectory}},
        dependencies.exec,
      );
    } catch (error) {
      if (
        error.message.includes('UnsupportedModulePropertyParserError') &&
        error.message.includes('TSTypeReference')
      ) {
        return;
      }
      throw error;
    }

    throw new Error('RN 0.77.3 unexpectedly accepted the beta.8 EventEmitter form');
  }, dependencies.logger);
}

function createConsumerPackage(entry, tarballPath) {
  return {
    name: `rn-nfc-codegen-consumer-${entry.reactNative.replace(/\./g, '-')}`,
    version: '1.0.0',
    private: true,
    dependencies: {
      react: entry.react,
      'react-native': entry.reactNative,
      'react-native-nfc-manager': `file:${tarballPath}`,
    },
  };
}

function runEntry(entry, tarballPath, temporaryRoot, options, dependencies) {
  const safeVersion = entry.reactNative.replace(/\./g, '-');
  const consumerDirectory = join(temporaryRoot, `consumer-${safeVersion}`);
  const npmCache = join(temporaryRoot, `npm-cache-${safeVersion}`);
  const workingDirectory = join(temporaryRoot, `work-${safeVersion}`);
  mkdirSync(consumerDirectory, {recursive: true});
  mkdirSync(workingDirectory, {recursive: true});
  writeFileSync(
    join(consumerDirectory, 'package.json'),
    `${JSON.stringify(createConsumerPackage(entry, tarballPath), null, 2)}\n`,
  );

  runPhase(entry, PHASES.install, () => {
    runNpm(
      [
        'install',
        '--ignore-scripts',
        '--no-audit',
        '--no-fund',
        '--package-lock=false',
      ],
      {
        execOptions: {
          cwd: consumerDirectory,
          env: {...process.env, npm_config_cache: npmCache},
        },
      },
      dependencies,
    );
  }, dependencies.logger);

  const tools = runPhase(
    entry,
    PHASES.discovery,
    () => discoverCodegen(consumerDirectory),
    dependencies.logger,
  );

  if (options.assertBeta8Regression) {
    assertBeta8Regression({
      consumerDirectory,
      entry,
      tools,
      workingDirectory,
      dependencies,
    });
  }

  const androidFiles = generatePlatform({
    consumerDirectory,
    entry,
    platform: 'android',
    tools,
    workingDirectory,
    dependencies,
  });
  const iosFiles = generatePlatform({
    consumerDirectory,
    entry,
    platform: 'ios',
    tools,
    workingDirectory,
    dependencies,
  });

  return {entry, androidFiles, iosFiles};
}

function packLibrary(repositoryRoot, temporaryRoot, dependencies) {
  runNpm(
    ['run', 'build'],
    {execOptions: {cwd: repositoryRoot}},
    dependencies,
  );

  const packDirectory = join(temporaryRoot, 'package');
  mkdirSync(packDirectory, {recursive: true});
  const output = runNpm(
    [
      'pack',
      '--json',
      '--ignore-scripts',
      '--pack-destination',
      packDirectory,
    ],
    {capture: true, execOptions: {cwd: repositoryRoot}},
    dependencies,
  );
  const [pack] = JSON.parse(output);
  const tarballPath = join(packDirectory, pack.filename);
  if (!existsSync(tarballPath)) {
    throw new Error(`npm pack did not create ${tarballPath}`);
  }
  return tarballPath;
}

function runMatrix(options, dependencies = {}) {
  const repositoryRoot = dependencies.repositoryRoot ?? resolve(__dirname, '..');
  const runtimeDependencies = {
    exec: dependencies.exec ?? execFileSync,
    logger: dependencies.logger ?? console.log,
    npmExecPath: dependencies.npmExecPath ?? process.env.npm_execpath,
  };
  const entries = selectMatrix(options.version);

  return withTemporaryDirectory('rn-nfc-codegen-', (temporaryRoot) => {
    const tarballPath = packLibrary(
      repositoryRoot,
      temporaryRoot,
      runtimeDependencies,
    );
    return entries.map((entry) =>
      runEntry(
        entry,
        tarballPath,
        temporaryRoot,
        options,
        runtimeDependencies,
      ),
    );
  });
}

module.exports = {
  MATRIX,
  PHASES,
  createConsumerPackage,
  formatFailure,
  makeBeta8QualifiedSpec,
  npmInvocation,
  parseArgs,
  requireNonEmptyOutput,
  runCommand,
  runMatrix,
  runPhase,
  selectMatrix,
  withTemporaryDirectory,
};
