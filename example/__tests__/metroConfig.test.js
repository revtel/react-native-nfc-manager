const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { resolve: metroResolve } = require('metro-resolver');

jest.mock('@react-native/metro-config', () => ({
  getDefaultConfig: jest.fn(() => ({})),
  mergeConfig: jest.fn((_defaults, config) => config),
}));

const config = require('../metro.config');
const exampleRoot = path.resolve(__dirname, '..');
const workspaceRoot = path.resolve(exampleRoot, '..');
const appOrigin = path.join(exampleRoot, 'App.tsx');
const linkedOrigin = path.join(workspaceRoot, 'dist/src/index.js');
// Jest also wraps createRequire. A Node subprocess bypasses its moduleNameMapper,
// which already pins RN for tests and would hide the linked package's copy.
const nodeResolve = (origin, name) => execFileSync(process.execPath, [
  '-e',
  'process.stdout.write(require("node:module").createRequire(process.argv[1]).resolve(process.argv[2]))',
  origin,
  name,
], { encoding: 'utf8' });
const nodeResolver = (context, name) => ({
  type: 'sourceFile',
  filePath: nodeResolve(context.originModulePath, name),
});

test.each([
  'react',
  'react/jsx-runtime',
  'react-native',
  'react-native/Libraries/Utilities/Platform.ios.js',
])('app and linked-library %s resolve to the same installed app runtime', name => {
  const defaultResolver = jest.fn(nodeResolver);
  const resolutions = [appOrigin, linkedOrigin].map(originModulePath =>
    config.resolver.resolveRequest({ originModulePath, resolveRequest: defaultResolver }, name, 'ios'),
  );

  expect(resolutions.map(result => result.filePath)).toEqual([
    nodeResolve(appOrigin, name),
    nodeResolve(appOrigin, name),
  ]);
  expect(defaultResolver).toHaveBeenCalledTimes(2);
  expect(defaultResolver.mock.calls.every(call => call[2] === 'ios')).toBe(true);
});

test('the linked-library origin would select a second React without the override', () => {
  expect(nodeResolve(linkedOrigin, 'react')).not.toBe(nodeResolve(appOrigin, 'react'));
  const context = { originModulePath: linkedOrigin, resolveRequest: nodeResolver };
  expect(config.resolver.resolveRequest(context, 'react', 'ios').filePath).toBe(nodeResolve(appOrigin, 'react'));
});

test('other packages keep their original resolver context and resolution', () => {
  const defaultResolver = jest.fn(nodeResolver);
  const context = { originModulePath: linkedOrigin, resolveRequest: defaultResolver };
  const name = '@babel/runtime/helpers/interopRequireDefault';
  const expected = nodeResolve(linkedOrigin, name);

  expect(config.resolver.resolveRequest(context, name, 'android').filePath).toBe(expected);
  expect(defaultResolver).toHaveBeenCalledWith(context, name, 'android');
  expect(defaultResolver.mock.calls[0][0]).toBe(context);
});

test('similar package names are not mistaken for React Native', () => {
  const defaultResolver = jest.fn(() => ({ type: 'sourceFile', filePath: '/unchanged/module.js' }));
  const context = { originModulePath: linkedOrigin, resolveRequest: defaultResolver };

  config.resolver.resolveRequest(context, 'react-native-nfc-manager', 'ios');

  expect(defaultResolver.mock.calls[0][0]).toBe(context);
});

// Use Metro's real resolver against installed files for the no-fallback cases.
// Only filesystem visibility changes; no dependency is moved or removed.
function metroContext(hiddenPath) {
  const hidden = filename => filename === hiddenPath || filename.startsWith(`${hiddenPath}${path.sep}`);
  return {
    originModulePath: linkedOrigin,
    resolveRequest: metroResolve,
    allowHaste: false,
    disableHierarchicalLookup: false,
    nodeModulesPaths: config.resolver.nodeModulesPaths,
    extraNodeModules: {
      react: path.join(workspaceRoot, 'node_modules/react'),
      'react-native': path.join(workspaceRoot, 'node_modules/react-native'),
    },
    assetExts: new Set(),
    sourceExts: ['js', 'json', 'ts', 'tsx'],
    preferNativePlatform: true,
    mainFields: ['react-native', 'main'],
    getPackageForModule: () => null,
    getPackage: filename => JSON.parse(fs.readFileSync(filename, 'utf8')),
    doesFileExist: filename => !hidden(filename) && fs.existsSync(filename),
    fileSystemLookup(filename) {
      if (hidden(filename)) return { exists: false };
      try {
        const stat = fs.statSync(filename);
        return { exists: true, type: stat.isDirectory() ? 'd' : 'f', realPath: fs.realpathSync(filename) };
      } catch {
        return { exists: false };
      }
    },
  };
}

test.each([
  ['react', 'react'],
  ['react/jsx-runtime', 'react/jsx-runtime.js'],
  ['react-native', 'react-native'],
  ['react-native/Libraries/Utilities/Platform.ios.js', 'react-native/Libraries/Utilities/Platform.ios.js'],
])('missing app %s fails instead of using an available root copy', (name, missing) => {
  const context = metroContext(path.join(exampleRoot, 'node_modules', missing));
  // Prove that fallback would succeed with the unmodified default context.
  expect(metroResolve(context, name, 'ios').filePath.startsWith(path.join(workspaceRoot, 'node_modules'))).toBe(true);
  expect(() => config.resolver.resolveRequest(context, name, 'ios')).toThrow();
});
