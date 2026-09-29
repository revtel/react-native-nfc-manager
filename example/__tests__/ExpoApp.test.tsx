import React from 'react';
import ReactTestRenderer, {act} from 'react-test-renderer';
import {Platform} from 'react-native';
import NfcManager, {NfcEvents} from 'react-native-nfc-manager';
import App from '../../example-expo/App';

jest.mock('react-native-safe-area-context', () => {
  const {View} = require('react-native');
  return {SafeAreaProvider: View, SafeAreaView: View};
});

jest.mock('react-native-nfc-manager', () => ({
  __esModule: true,
  default: {
    setEventListener: jest.fn(),
    requestTechnology: jest.fn(),
    cancelTechnologyRequest: jest.fn(),
    registerTagEvent: jest.fn(),
    unregisterTagEvent: jest.fn(),
    getTag: jest.fn(),
    nfcAHandler: {transceive: jest.fn()},
  },
  NfcEvents: {DiscoverTag: 'discover', SessionClosed: 'closed'},
  NfcTech: {Ndef: 'Ndef', NfcA: 'NfcA'},
}));

const manager = NfcManager as jest.Mocked<typeof NfcManager>;
const originalOS = Platform.OS;
let renderer: ReactTestRenderer.ReactTestRenderer;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return {promise, resolve, reject};
}

async function press(label: string) {
  const testID = label === 'Cancel' ? 'android-nfc-scan-prompt-cancel' : label;
  const button = renderer.root.findAllByProps({testID})[0];
  if (!button) {
    throw new Error(`Missing button: ${label}`);
  }
  await act(async () => { button.props.onPress(); });
}

function promptTitle() {
  return renderer.root.findAll(node => typeof node.props.children === 'string')
    .map(node => node.props.children);
}

beforeEach(async () => {
  jest.resetAllMocks();
  Object.defineProperty(Platform, 'OS', {configurable: true, value: 'android'});
  manager.requestTechnology.mockResolvedValue(null);
  manager.getTag.mockResolvedValue({id: 'test-tag'});
  manager.cancelTechnologyRequest.mockResolvedValue(undefined);
  manager.registerTagEvent.mockResolvedValue(undefined);
  manager.unregisterTagEvent.mockResolvedValue(undefined);
  await act(async () => { renderer = ReactTestRenderer.create(<App />); });
});

afterEach(async () => {
  await act(async () => { renderer.unmount(); });
  Object.defineProperty(Platform, 'OS', {configurable: true, value: originalOS});
  jest.useRealTimers();
});

test('Android prompt remains visible through tag I/O and asynchronous cleanup', async () => {
  const request = deferred<null>();
  const tag = deferred<{id: string}>();
  const cleanup = deferred<void>();
  manager.requestTechnology.mockReturnValueOnce(request.promise);
  manager.getTag.mockReturnValueOnce(tag.promise);
  manager.cancelTechnologyRequest.mockReturnValueOnce(cleanup.promise);

  await press('Read NDEF');
  expect(promptTitle()).toContain('Ready to Scan');
  await act(async () => { request.resolve(null); });
  expect(promptTitle()).toContain('Tag Connected');
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.visible).toBe(true);
  await act(async () => { tag.resolve({id: 'test-tag'}); });
  expect(promptTitle()).toContain('Closing NFC Session');
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-prompt-cancel'})[0].props.disabled).toBe(true);
  await act(async () => { cleanup.resolve(undefined); });
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.visible).toBe(false);
});

test('manual cancellation, Android back, and flow cleanup share one native cancellation', async () => {
  const request = deferred<null>();
  const cleanup = deferred<void>();
  manager.requestTechnology.mockReturnValueOnce(request.promise);
  manager.cancelTechnologyRequest.mockImplementationOnce(() => {
    request.reject(new Error('cancelled'));
    return cleanup.promise;
  });
  await press('Read NDEF');
  await press('Cancel');
  await act(async () => { renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.onRequestClose(); });
  expect(manager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
  expect(promptTitle()).toContain('Closing NFC Session');
  await act(async () => { cleanup.resolve(undefined); });
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.visible).toBe(false);
  await press('Read NDEF');
  expect(manager.getTag).toHaveBeenCalledTimes(1);
  expect(manager.cancelTechnologyRequest).toHaveBeenCalledTimes(2);
});

test('cleanup failure keeps the prompt available for a successful retry', async () => {
  manager.getTag.mockRejectedValueOnce(new Error('tag lost'));
  manager.cancelTechnologyRequest.mockRejectedValueOnce(new Error('cleanup failed'));
  await press('Read NDEF');
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.visible).toBe(true);
  expect(promptTitle()).toContain('Tag Connected');
  await press('Cancel');
  expect(manager.cancelTechnologyRequest).toHaveBeenCalledTimes(2);
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.visible).toBe(false);
});

test('one-shot discovery keeps the prompt until unregister completes', async () => {
  const cleanup = deferred<void>();
  manager.unregisterTagEvent.mockReturnValueOnce(cleanup.promise);
  await press('One-shot tag event');
  expect(promptTitle()).toContain('Ready to Scan');
  const callback = (manager.setEventListener as jest.Mock).mock.calls.find(
    ([event]) => event === NfcEvents.DiscoverTag,
  )![1];
  await act(async () => { callback({id: 'test-tag'}); });
  expect(promptTitle()).toContain('Closing NFC Session');
  await act(async () => { renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.onRequestClose(); });
  expect(manager.unregisterTagEvent).toHaveBeenCalledTimes(1);
  expect(manager.cancelTechnologyRequest).not.toHaveBeenCalled();
  await act(async () => { cleanup.resolve(undefined); });
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.visible).toBe(false);
});

test('automatic cancellation uses the same prompt cleanup path', async () => {
  jest.useFakeTimers();
  const request = deferred<null>();
  manager.requestTechnology.mockReturnValueOnce(request.promise);
  manager.cancelTechnologyRequest.mockImplementationOnce(async () => {
    request.reject(new Error('cancelled'));
  });
  await press('Cancel pending NDEF (2.5s)');
  expect(promptTitle()).toContain('Ready to Scan');
  await act(async () => { await jest.advanceTimersByTimeAsync(2500); });
  expect(manager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.visible).toBe(false);
});

test('iOS uses its native sheet without an Android prompt', async () => {
  Object.defineProperty(Platform, 'OS', {configurable: true, value: 'ios'});
  await press('Read NDEF');
  expect(renderer.root.findAllByProps({testID: 'android-nfc-scan-modal'})[0].props.visible).toBe(false);
  expect(manager.cancelTechnologyRequest).toHaveBeenCalledWith();
});
