jest.mock('../src/NativeNfcManager');

import {Platform} from 'react-native';
import {NativeNfcManager} from '../src/NativeNfcManager';
import * as NfcError from '../src/NfcError';

describe('NfcManager (android)', () => {
  Platform.setOS('android');
  const NfcManagerModule = require('../src/index.js');
  const NfcManager = NfcManagerModule.default;
  const {NfcTech} = NfcManagerModule;

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
