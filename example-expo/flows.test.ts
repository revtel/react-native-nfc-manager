jest.mock('react-native', () => ({Platform: {OS: 'android'}}));

jest.mock('react-native-nfc-manager', () => ({
  __esModule: true,
  default: {
    start: jest.fn(),
    isSupported: jest.fn(),
    isEnabled: jest.fn(),
    requestTechnology: jest.fn(),
    getTag: jest.fn(),
    cancelTechnologyRequest: jest.fn(),
    nfcAHandler: {transceive: jest.fn()},
  },
  NfcTech: {Ndef: 'Ndef', NfcA: 'NfcA'},
}));

import {Platform} from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import {cancelPendingNdef, errorText, readNdef, readNfcA, startNfc} from './flows';

const manager = NfcManager as jest.Mocked<typeof NfcManager>;

test('identifies NFC error subclasses without a message', () => {
  class FirstNdefInvalid extends Error {}
  class Timeout extends Error {}
  expect(errorText(new FirstNdefInvalid())).toBe('FirstNdefInvalid');
  expect(errorText(new Timeout())).toBe('Timeout');
  expect(errorText(new Error('read failed'))).toBe('read failed');
});

beforeEach(() => {
  jest.resetAllMocks();
  (Platform as {OS: string}).OS = 'android';
  manager.cancelTechnologyRequest.mockResolvedValue(undefined);
});

test('logs NDEF request, tag, and cleanup in order', async () => {
  manager.requestTechnology.mockResolvedValue(undefined);
  manager.getTag.mockResolvedValue({id: 'test-tag'});
  const lines: string[] = [];
  await readNdef(line => lines.push(line));
  expect(lines).toEqual([
    'requestTechnology(Ndef) pending; scan a tag',
    'requestTechnology(Ndef) success',
    'getTag(): {"id":"test-tag"}',
    'cancelTechnologyRequest() success',
  ]);
});

test('reports NDEF read and cleanup errors', async () => {
  manager.requestTechnology.mockResolvedValue(undefined);
  manager.getTag.mockRejectedValue(new Error('read failed'));
  manager.cancelTechnologyRequest.mockRejectedValue(new Error('cleanup failed'));
  const lines: string[] = [];
  await readNdef(line => lines.push(line));
  expect(lines).toContain('NDEF error: read failed');
  expect(lines).toContain('cancelTechnologyRequest() error: cleanup failed');
});

test('cancels a pending request and observes its rejection', async () => {
  manager.requestTechnology.mockImplementation(
    () => new Promise((_resolve, reject) => {
      manager.cancelTechnologyRequest.mockImplementation(async () => {
        reject(new Error('cancelled'));
      });
    }),
  );
  const lines: string[] = [];
  await cancelPendingNdef(line => lines.push(line), 0);
  expect(lines).toContain('requestTechnology(Ndef) rejected: cancelled');
  expect(lines).toContain('cancelTechnologyRequest() success');
});

test('reports a request that remains pending after cancellation', async () => {
  manager.requestTechnology.mockReturnValue(new Promise(() => {}));
  const lines: string[] = [];
  await cancelPendingNdef(line => lines.push(line), 0, 0);
  expect(lines).toContain('requestTechnology(Ndef) did not settle after cancellation');
});

test('NfcA is Android-only and logs transceive result', async () => {
  const lines: string[] = [];
  (Platform as {OS: string}).OS = 'ios';
  await readNfcA(line => lines.push(line));
  expect(lines).toEqual(['NfcA transceive is Android-only']);
  expect(manager.requestTechnology).not.toHaveBeenCalled();
  (Platform as {OS: string}).OS = 'android';
  manager.requestTechnology.mockResolvedValue(undefined);
  manager.nfcAHandler.transceive = jest.fn().mockResolvedValue([1, 2]);
  await readNfcA(line => lines.push(line));
  expect(lines).toContain('transceive([0x30,0x00]): [1,2]');
  expect(lines).toContain('cancelTechnologyRequest() success');
});

test('start logs support and enabled status', async () => {
  manager.start.mockResolvedValue(undefined);
  manager.isSupported.mockResolvedValue(true);
  manager.isEnabled.mockResolvedValue(true);
  const lines: string[] = [];
  await startNfc(line => lines.push(line));
  expect(lines).toEqual(['start() success', 'isSupported(Ndef): true', 'isEnabled(): true']);
});
