const runtimeKeys = [
  '__DEV__',
  'RN$Bridgeless',
  '__turboModuleProxy',
  'nativeFabricUIManager',
];
let savedGlobals;
let warn;
let reactNative;
let nativeModule;

function version(minor, major = 0) {
  return {major, minor, patch: 1};
}

function load() {
  return jest.requireActual('../src/NativeNfcManager');
}

beforeEach(() => {
  jest.resetModules();
  savedGlobals = Object.fromEntries(
    runtimeKeys.map((key) => [key, Object.getOwnPropertyDescriptor(global, key)]),
  );
  for (const key of runtimeKeys) {
    delete global[key];
  }
  global.__DEV__ = true;
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  nativeModule = {
    addListener: jest.fn(),
    removeListeners: jest.fn(),
    start: jest.fn((callback) => callback(null, 'started')),
  };
  reactNative = {
    Platform: {OS: 'android', constants: {reactNativeVersion: version(84)}},
    NativeModules: {NfcManager: nativeModule},
    NativeEventEmitter: jest.fn(() => ({addListener: jest.fn()})),
    TurboModuleRegistry: {get: jest.fn(() => nativeModule)},
  };
  jest.doMock('react-native', () => reactNative);
});

afterEach(() => {
  warn.mockRestore();
  for (const key of runtimeKeys) {
    delete global[key];
    if (savedGlobals[key]) {
      Object.defineProperty(global, key, savedGlobals[key]);
    }
  }
  jest.dontMock('react-native');
});

test('warns once below the RN floor without disabling available callbacks', async () => {
  reactNative.Platform.constants.reactNativeVersion = version(75);
  const bridge = load();
  const {warnRuntimeCompatibility} = require('../src/runtimeCompatibility');
  warnRuntimeCompatibility();
  load();
  await expect(bridge.callNative('start')).resolves.toBe('started');
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining('React Native 0.75.1 is unsupported'),
  );
  expect(warn.mock.calls[0][0]).toContain('0.76+');
});

test.each([76, 77, 81])('warns for RN 0.%s without New Architecture signals', (minor) => {
  reactNative.Platform.constants.reactNativeVersion = version(minor);
  load();
  expect(warn).toHaveBeenCalledTimes(1);
  expect(warn.mock.calls[0][0]).toContain('Enable it in your app and rebuild');
});

test.each([
  ['RN$Bridgeless', true],
  ['__turboModuleProxy', jest.fn()],
  ['nativeFabricUIManager', {}],
])('recognizes the %s runtime signal on RN 0.76', (key, value) => {
  reactNative.Platform.constants.reactNativeVersion = version(76);
  global[key] = value;
  load();
  expect(warn).not.toHaveBeenCalled();
});

test.each([82, 84, 99])('does not require an architecture opt-in on RN 0.%s', (minor) => {
  reactNative.Platform.constants.reactNativeVersion = version(minor);
  load();
  expect(warn).not.toHaveBeenCalled();
});

test('does not classify future major releases as unsupported', () => {
  reactNative.Platform.constants.reactNativeVersion = version(0, 1);
  load();
  expect(warn).not.toHaveBeenCalled();
});

test.each([undefined, null, {}, {major: 0, minor: '75'}, {major: -1, minor: 75}])(
  'does not guess support from unknown or malformed version metadata: %p',
  (metadata) => {
    reactNative.Platform.constants.reactNativeVersion = metadata;
    load();
    expect(warn).not.toHaveBeenCalled();
  },
);

test('does not warn when platform constants are absent', () => {
  delete reactNative.Platform.constants;
  load();
  expect(warn).not.toHaveBeenCalled();
});

test.each([75, 76, 81])('production is silent for RN 0.%s', (minor) => {
  global.__DEV__ = false;
  reactNative.Platform.constants.reactNativeVersion = version(minor);
  load();
  expect(warn).not.toHaveBeenCalled();
});

test('an absent development flag is also silent', () => {
  delete global.__DEV__;
  reactNative.Platform.constants.reactNativeVersion = version(75);
  load();
  expect(warn).not.toHaveBeenCalled();
});

test.each([false, true])('missing legacy-path module has an actionable error (dev=%s)', (dev) => {
  global.__DEV__ = dev;
  reactNative.NativeModules = {};
  expect(load).toThrow('Expo apps require a Development Build');
  expect(reactNative.NativeEventEmitter).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
});

test('missing TurboModule is not misreported as old architecture', () => {
  global['RN$Bridgeless'] = true;
  reactNative.Platform.constants.reactNativeVersion = version(76);
  reactNative.TurboModuleRegistry.get.mockReturnValue(null);
  expect(load).toThrow('Verify native linking and rebuild');
  expect(reactNative.TurboModuleRegistry.get).toHaveBeenCalledWith('NfcManager');
  expect(reactNative.NativeEventEmitter).not.toHaveBeenCalled();
  expect(warn).not.toHaveBeenCalled();
});

test('warning is emitted before native lookup can fail', () => {
  reactNative.Platform.constants.reactNativeVersion = version(75);
  Object.defineProperty(reactNative.NativeModules, 'NfcManager', {
    get() {
      expect(warn).toHaveBeenCalledTimes(1);
      throw new Error('native lookup failed');
    },
  });
  expect(load).toThrow('native lookup failed');
});

test('TurboModule loader failures retain their original error', () => {
  global['RN$Bridgeless'] = true;
  reactNative.TurboModuleRegistry.get.mockImplementation(() => {
    throw new Error('native loader failure');
  });
  expect(load).toThrow('native loader failure');
});

test('supported TurboModule events and callback results retain their paths', async () => {
  global['RN$Bridgeless'] = true;
  const subscription = {remove: jest.fn()};
  nativeModule.onDiscoverTag = jest.fn(() => subscription);
  const {NfcManagerEmitter, callNative} = load();
  const listener = jest.fn();
  expect(NfcManagerEmitter.addListener('NfcManagerDiscoverTag', listener)).toBe(subscription);
  expect(nativeModule.onDiscoverTag).toHaveBeenCalledWith(listener);
  await expect(callNative('start')).resolves.toBe('started');
  nativeModule.start.mockImplementationOnce((callback) => callback('native error'));
  await expect(callNative('start')).rejects.toBe('native error');
  expect(warn).not.toHaveBeenCalled();
});
