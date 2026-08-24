jest.mock('../src/NativeNfcManager');

import {Platform} from 'react-native';
import {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
} from '../src/NativeNfcManager';
import * as NfcError from '../src/NfcError';

describe('NfcManager (android)', () => {
  Platform.setOS('android');
  const NfcManagerModule = require('../src/index');
  const NfcManager = NfcManagerModule.default;
  const {NfcEvents, NfcTech} = NfcManagerModule;
  const lastNativeCall = () =>
    callNative.mock.calls[callNative.mock.calls.length - 1];

  test('constructor', () => {
    expect(Platform.OS).toBe('android');
    // the NfcManager instance doest exist
    expect(!!NfcManager).toEqual(true);
  });

  test('mifareClassicHandler', async () => {
    expect(!!NfcManager.mifareClassicHandlerAndroid).toBe(true);

    try {
      // should throw exception if the data is not an array of length 16
      await NfcManager.mifareClassicHandlerAndroid.mifareClassicWriteBlock(1, [
        1,
      ]);
      expect(true).toBe(false);
    } catch (ex) {}

    // https://github.com/whitedogg13/react-native-nfc-manager/issues/371
    await NfcManager.mifareClassicHandlerAndroid.mifareClassicWriteBlock(
      5,
      Array.from({length: 16}).map((_, i) => i),
    );
  });

  test('mifareUltralightHandler', async () => {
    expect(!!NfcManager.mifareUltralightHandlerAndroid).toBe(true);

    try {
      // should throw exception if the data is not an array of length 4
      await NfcManager.mifareUltralightHandlerAndroid.mifareUltralightWritePage(
        1,
        [1],
      );
      expect(true).toBe(false);
    } catch (ex) {}

    // https://github.com/whitedogg13/react-native-nfc-manager/issues/386
    // https://github.com/whitedogg13/react-native-nfc-manager/issues/387
    await NfcManager.mifareUltralightHandlerAndroid.mifareUltralightWritePage(
      5,
      Array.from({length: 4}).map((_, i) => i),
    );
  });

  test('API: setAlertMessage', async () => {
    // test if the method stub exists and can be called without exception
    await NfcManager.setAlertMessage();
    expect(true).toBe(true);
  });

  test('API: deprecated NDEF push rejects explicitly', async () => {
    await expect(NfcManager.setNdefPushMessage([0xd1])).rejects.toBe(
      'this api is deprecated',
    );
  });

  test('API: cached NDEF remains Android-only handler behavior', async () => {
    await NfcManager.ndefHandler.getCachedNdefMessageAndroid();
    expect(lastNativeCall()[0]).toEqual('getCachedNdefMessage');
  });

  test('API: timeout forwards success and native errors', async () => {
    await NfcManager.setTimeout(500);
    expect(lastNativeCall()).toEqual(['setTimeout', [500]]);

    callNative.mockResolvedValueOnce(500);
    await expect(NfcManager.getTimeout()).resolves.toBe(500);

    NativeNfcManager.setNextError('timeout unavailable', 'getTimeout');
    await expect(NfcManager.getTimeout()).rejects.toMatchObject({
      message: 'timeout unavailable',
    });
  });

  test('API: state-change events deliver their native payload', () => {
    const onStateChanged = jest.fn();
    const state = {state: 'on'};
    NfcManager.setEventListener(NfcEvents.StateChanged, onStateChanged);
    NfcManagerEmitter._testTriggerCallback(NfcEvents.StateChanged, state);
    expect(onStateChanged).toHaveBeenCalledWith(state);
  });

  test('API: temporary tag registration is cleaned up on cancellation', async () => {
    callNative.mockClear();
    callNative.mockResolvedValueOnce(false);

    await NfcManager.requestTechnology(NfcTech.NfcA, {alertMessage: 'Tap'});
    await NfcManager.cancelTechnologyRequest({delayMsAndroid: 0});

    expect(callNative.mock.calls.map(([method]) => method)).toEqual([
      'hasTagEventRegistration',
      'registerTagEvent',
      'requestTechnology',
      'cancelTechnologyRequest',
      'unregisterTagEvent',
    ]);
    expect(NfcManager.cleanUpTagRegistration).toBe(false);
  });

  test('API: repeated request error reaches a terminal rejection', async () => {
    callNative.mockResolvedValueOnce(true);
    NativeNfcManager.setNextError(
      'Duplicated registration',
      'requestTechnology',
    );
    await expect(
      NfcManager.requestTechnology(NfcTech.Ndef),
    ).rejects.toMatchObject({message: 'Duplicated registration'});
  });

  test('API: MIFARE constants remain available', () => {
    expect(NfcManager.MIFARE_BLOCK_SIZE).toBe(16);
    expect(NfcManager.MIFARE_ULTRALIGHT_PAGE_SIZE).toBe(4);
    expect(NfcManager.MIFARE_ULTRALIGHT_TYPE).toBe(1);
    expect(NfcManager.MIFARE_ULTRALIGHT_TYPE_C).toBe(2);
    expect(NfcManager.MIFARE_ULTRALIGHT_TYPE_UNKNOWN).toBe(-1);
  });

  test('NfcError', async () => {
    try {
      NativeNfcManager.setNextError('cancelled');
      await NfcManager.requestTechnology(NfcTech.Ndef);
    } catch (ex) {
      if (!(ex instanceof NfcError.UserCancel)) {
        expect(true).toBe(false);
      }
    }
  });
});
