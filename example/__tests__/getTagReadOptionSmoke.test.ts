import { Platform } from 'react-native';
import NfcManager from 'react-native-nfc-manager';
import { verifyNtag215ReadOption } from '../getTagReadOptionSmoke';

jest.mock('react-native-nfc-manager', () => ({
  __esModule: true,
  default: {
    getTag: jest.fn(),
    sendMifareCommandIOS: jest.fn(),
    nfcAHandler: { transceive: jest.fn() },
  },
}));

const originalPlatformOS = Platform.OS;
const passwordHex = 'A1b2C3d4';
const authCommand = [0x1b, 0xa1, 0xb2, 0xc3, 0xd4];

function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
}

beforeEach(() => {
  jest.resetAllMocks();
  setPlatform('ios');
  (NfcManager.getTag as jest.Mock).mockResolvedValue({ id: '04AB', tech: 'mifare' });
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatformOS });
});

test.each(['ios', 'android'] as const)(
  '%s reads metadata twice before one authentication and one page 4 read',
  async os => {
    setPlatform(os);
    const steps: string[] = [];
    const send = (os === 'ios' ? NfcManager.sendMifareCommandIOS : NfcManager.nfcAHandler.transceive) as jest.Mock;
    const otherSend = os === 'ios' ? NfcManager.nfcAHandler.transceive : NfcManager.sendMifareCommandIOS;
    (NfcManager.getTag as jest.Mock).mockImplementation(async () => {
      steps.push('metadata');
      return os === 'android'
        ? { id: '04AB', ndefMessage: [{ payload: [9, 8, 7] }] }
        : { id: '04AB', tech: 'mifare' };
    });
    send.mockImplementation(async (bytes: number[]) => {
      steps.push(bytes[0] === 0x1b ? 'authenticate' : 'read');
      return bytes[0] === 0x1b ? [0x12, 0x34] : Array(16).fill(0x65);
    });
    const log = jest.fn();

    await expect(verifyNtag215ReadOption(passwordHex, log)).resolves.toBeUndefined();

    expect(steps).toEqual(['metadata', 'metadata', 'authenticate', 'read']);
    expect((NfcManager.getTag as jest.Mock).mock.calls).toEqual([
      [{ readNdef: false }], [{ readNdef: false }],
    ]);
    expect(send.mock.calls).toEqual([[authCommand], [[0x30, 0x04]]]);
    expect(otherSend).not.toHaveBeenCalled();
    expect(log.mock.calls).toEqual([
      ['PASS metadata without NDEF read 1/2: id=04AB'],
      ['PASS metadata without NDEF read 2/2: id=04AB'],
      ['PASS authentication acknowledgement: 2 bytes'],
      ['PASS page 4 read after authentication: 16 bytes; protection range not checked'],
    ]);
  },
);

test.each(['', '1234567', '123456789', 'GG112233', ' A1B2C3D4', 'A1B2 C3D4', 'A1B2C3D4\n'])(
  'invalid password format makes no NFC calls: %j',
  async input => {
    await expect(verifyNtag215ReadOption(input, jest.fn())).rejects.toThrow('exactly 8 hexadecimal');
    expect(NfcManager.getTag).not.toHaveBeenCalled();
    expect(NfcManager.sendMifareCommandIOS).not.toHaveBeenCalled();
    expect(NfcManager.nfcAHandler.transceive).not.toHaveBeenCalled();
  },
);

test('iOS refuses unexpected NDEF content before authentication', async () => {
  (NfcManager.getTag as jest.Mock).mockResolvedValue({ id: '04AB', ndefMessage: [] });
  await expect(verifyNtag215ReadOption(passwordHex, jest.fn())).rejects.toThrow('unexpectedly contains NDEF');
  expect(NfcManager.sendMifareCommandIOS).not.toHaveBeenCalled();
});

test.each([{ response: [] }, { response: [0x00] }, { response: [0x12, 0x34, 0x56] }])(
  'invalid authentication response does not proceed to a read: %j',
  async ({ response }) => {
    (NfcManager.sendMifareCommandIOS as jest.Mock).mockResolvedValue(response);
    await expect(verifyNtag215ReadOption(passwordHex, jest.fn())).rejects.toThrow('2-byte acknowledgement');
    expect(NfcManager.sendMifareCommandIOS).toHaveBeenCalledTimes(1);
  },
);

test('authentication rejection does not read or expose native error details', async () => {
  const log = jest.fn();
  (NfcManager.sendMifareCommandIOS as jest.Mock).mockRejectedValue(new Error(`native command ${passwordHex}`));
  await expect(verifyNtag215ReadOption(passwordHex, log)).rejects.toThrow(
    'NTAG215 authentication failed; no retry was attempted',
  );
  expect(NfcManager.sendMifareCommandIOS).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(log.mock.calls)).not.toContain(passwordHex);
});

test('unexpected read length fails without retry', async () => {
  (NfcManager.sendMifareCommandIOS as jest.Mock)
    .mockResolvedValueOnce([0x12, 0x34])
    .mockResolvedValueOnce([0x00]);
  await expect(verifyNtag215ReadOption(passwordHex, jest.fn())).rejects.toThrow('did not return 16 bytes');
  expect(NfcManager.sendMifareCommandIOS).toHaveBeenCalledTimes(2);
});

test('read rejection does not expose native error details', async () => {
  const log = jest.fn();
  (NfcManager.sendMifareCommandIOS as jest.Mock)
    .mockResolvedValueOnce([0x12, 0x34])
    .mockRejectedValueOnce(new Error(`native response ${passwordHex}`));
  await expect(verifyNtag215ReadOption(passwordHex, log)).rejects.toThrow(
    'NTAG215 page 4 read failed after authentication',
  );
  expect(NfcManager.sendMifareCommandIOS).toHaveBeenCalledTimes(2);
  expect(JSON.stringify(log.mock.calls)).not.toContain(passwordHex);
});
