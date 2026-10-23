import NfcManager, { Ndef, NdefStatus } from 'react-native-nfc-manager';
import { verifySavedNdef, writeReadSameSession } from '../ndefWriteReadSmoke';

jest.mock('react-native-nfc-manager', () => ({
  __esModule: true,
  Ndef: jest.requireActual('../../dist/ndef-lib'),
  NdefStatus: { ReadWrite: 2, ReadOnly: 3 },
  default: {
    getTag: jest.fn(),
    ndefHandler: {
      getNdefMessage: jest.fn(),
      getNdefStatus: jest.fn(),
      writeNdefMessage: jest.fn(),
    },
  },
}));

const handler = NfcManager.ndefHandler;
const message = (text: string, id = '04AB') => ({
  id,
  ndefMessage: [{ ...Ndef.textRecord(text), type: [0x54], id: '' }],
});

beforeEach(() => {
  jest.resetAllMocks();
  jest.spyOn(Date, 'now').mockReturnValue(123456789);
  (handler.getNdefStatus as jest.Mock).mockResolvedValue({ status: NdefStatus.ReadWrite, capacity: 144 });
  (NfcManager.getTag as jest.Mock).mockResolvedValue(message('old'));
});

afterEach(() => jest.restoreAllMocks());

test('two distinct writes are read live without reconnecting', async () => {
  (handler.getNdefMessage as jest.Mock)
    .mockResolvedValueOnce(message('NFC843-123456789-A'))
    .mockResolvedValueOnce(message('NFC843-123456789-B'));
  await expect(writeReadSameSession(jest.fn())).resolves.toEqual({ tagId: '04AB', text: 'NFC843-123456789-B' });
  expect(handler.writeNdefMessage).toHaveBeenCalledTimes(2);
  expect(handler.getNdefMessage).toHaveBeenCalledTimes(2);
  expect((handler.writeNdefMessage as jest.Mock).mock.calls.every(call => call[1].reconnectAfterWrite === false)).toBe(true);
});

test('stale readback is a failure, not a hardware pass', async () => {
  (handler.getNdefMessage as jest.Mock).mockResolvedValue(message('old'));
  await expect(writeReadSameSession(jest.fn())).rejects.toThrow('NDEF readback mismatch');
  expect(handler.writeNdefMessage).toHaveBeenCalledTimes(1);
});

test.each([
  { status: NdefStatus.ReadOnly, capacity: 144 },
  { status: NdefStatus.ReadWrite, capacity: 8 },
])('refuses unsuitable tag before writing: %j', async status => {
  (handler.getNdefMessage as jest.Mock).mockResolvedValue(message('old'));
  (handler.getNdefStatus as jest.Mock).mockResolvedValue(status);
  await expect(writeReadSameSession(jest.fn())).rejects.toThrow('not writable or has insufficient');
  expect(handler.writeNdefMessage).not.toHaveBeenCalled();
});

test('persistence verification rejects a different tag even with matching content', async () => {
  (handler.getNdefMessage as jest.Mock).mockResolvedValue(message('saved', 'OTHER'));
  await expect(verifySavedNdef({ tagId: '04AB', text: 'saved' }, jest.fn())).rejects.toThrow('same tag');
});
