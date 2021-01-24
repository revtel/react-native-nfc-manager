jest.mock('../src/NativeNfcManager');

import {
  Platform
} from 'react-native'
import NfcManager from '../src/NfcManager';

test('baseline', () => {
  expect(Platform.OS).toBe('android');
});

test('NfcManager', () => {
  expect(!!NfcManager).toEqual(true);
});
