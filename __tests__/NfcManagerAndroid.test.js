jest.mock('../src/NativeNfcManager');

import {Platform} from 'react-native';

describe('NfcManager (android)', () => {
  Platform.setOS('android');
  const NfcManagerModule = require('../src/index.js');
  const NfcManager = NfcManagerModule.default;

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

    // testcase for https://github.com/whitedogg13/react-native-nfc-manager/issues/371
    await NfcManager.mifareClassicHandlerAndroid.mifareClassicWriteBlock(
      5,
      Array.from({length: 16}).map((_, i) => i),
    );
  });
});
