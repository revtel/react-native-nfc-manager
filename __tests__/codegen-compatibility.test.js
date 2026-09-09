'use strict';

const {existsSync, readFileSync} = require('fs');
const {
  MATRIX,
  PHASES,
  createConsumerPackage,
  makeBeta8QualifiedSpec,
  parseArgs,
  runCommand,
  runPhase,
  selectMatrix,
  withTemporaryDirectory,
} = require('../scripts/codegen-compatibility');

describe('React Native Codegen compatibility runner', () => {
  test('defines exact support-floor, regression, and baseline entries', () => {
    expect(MATRIX).toEqual([
      {reactNative: '0.76.9', react: '18.3.1', role: 'support floor'},
      {
        reactNative: '0.77.3',
        react: '18.3.1',
        role: 'EventEmitter regression line',
      },
      {reactNative: '0.84.0', react: '19.2.3', role: 'development baseline'},
    ]);
  });

  test('selects the full matrix or one exact entry', () => {
    expect(selectMatrix(null)).toHaveLength(3);
    expect(selectMatrix('0.77.3')).toEqual([MATRIX[1]]);
    expect(() => selectMatrix('0.80.0')).toThrow(
      'Unsupported React Native version "0.80.0"',
    );
  });

  test('parses focused and regression CLI options', () => {
    expect(parseArgs([])).toEqual({
      version: null,
      assertBeta8Regression: false,
    });
    expect(
      parseArgs(['--version=0.77.3', '--assert-beta8-regression']),
    ).toEqual({version: '0.77.3', assertBeta8Regression: true});
    expect(() => parseArgs(['--version'])).toThrow(
      '--version requires an exact React Native version',
    );
  });

  test('creates an isolated consumer dependency contract', () => {
    expect(createConsumerPackage(MATRIX[0], '/tmp/library.tgz')).toMatchObject({
      private: true,
      dependencies: {
        react: '18.3.1',
        'react-native': '0.76.9',
        'react-native-nfc-manager': 'file:/tmp/library.tgz',
      },
    });
  });

  test('labels phase failures with version and phase', () => {
    expect(() =>
      runPhase(
        MATRIX[1],
        PHASES.iosSchema,
        () => {
          throw new Error('parser rejected TSTypeReference');
        },
        () => {},
      ),
    ).toThrow(
      'Codegen compatibility failed [RN 0.77.3] [iOS schema parsing]: parser rejected TSTypeReference',
    );
  });

  test('propagates child-process status and output', () => {
    const failingExec = () => {
      const error = new Error('failed');
      error.status = 7;
      error.stderr = 'UnsupportedModulePropertyParserError';
      throw error;
    };
    expect(() =>
      runCommand('node', ['parser.js'], {capture: true}, failingExec),
    ).toThrow(
      'Command failed (7): node parser.js\nUnsupportedModulePropertyParserError',
    );
  });

  test('removes its temporary directory after success and failure', () => {
    let successfulDirectory;
    withTemporaryDirectory('rn-nfc-codegen-test-', (directory) => {
      successfulDirectory = directory;
      expect(existsSync(directory)).toBe(true);
    });
    expect(existsSync(successfulDirectory)).toBe(false);

    let failedDirectory;
    expect(() =>
      withTemporaryDirectory('rn-nfc-codegen-test-', (directory) => {
        failedDirectory = directory;
        throw new Error('expected failure');
      }),
    ).toThrow('expected failure');
    expect(existsSync(failedDirectory)).toBe(false);
  });

  test('recreates the beta.8 qualified EventEmitter form', () => {
    const currentSpec = readFileSync('specs/NativeNfcManager.ts', 'utf8');
    const beta8Spec = makeBeta8QualifiedSpec(currentSpec);
    expect(beta8Spec).toContain(
      "import type {CodegenTypes, TurboModule} from 'react-native';",
    );
    expect(beta8Spec).toContain(
      'readonly onDiscoverTag: CodegenTypes.EventEmitter<Object>;',
    );
    expect(beta8Spec).not.toContain(
      "react-native/Libraries/Types/CodegenTypes",
    );
  });
});
