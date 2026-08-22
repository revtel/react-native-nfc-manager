jest.mock('../src/NativeNfcManager');

import {Platform} from 'react-native';
import {NativeNfcManager, callNative} from '../src/NativeNfcManager';
import * as NfcError from '../src/NfcError';

describe('NfcManager (android)', () => {
  Platform.setOS('android');
  const NfcManagerModule = require('../src/index');
  const NfcManager = NfcManagerModule.default;
  const {NfcTech} = NfcManagerModule;
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
