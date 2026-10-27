/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Platform } from 'react-native';
import App from '../App';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';
import { verifyNtag215ReadOption } from '../getTagReadOptionSmoke';

jest.mock('../getTagReadOptionSmoke', () => ({
  verifyNtag215ReadOption: jest.fn(async () => undefined),
}));

const defaultPlatformOS = Platform.OS;

jest.mock('react-native-nfc-manager', () => {
  const NfcEvents = {
    DiscoverTag: 'NfcManagerDiscoverTag',
    SessionClosed: 'NfcManagerSessionClosed',
  };

  const NfcTech = {
    Ndef: 'Ndef',
    NfcA: 'NfcA',
    NfcV: 'NfcV',
    IsoDep: 'IsoDep',
    Iso15693IOS: 'iso15693',
    MifareIOS: 'mifare',
  };

  return {
    __esModule: true,
    default: {
      setEventListener: jest.fn(),
      start: jest.fn(async () => undefined),
      isSupported: jest.fn(async () => true),
      isEnabled: jest.fn(async () => true),
      requestTechnology: jest.fn(async () => undefined),
      registerTagEvent: jest.fn(async () => undefined),
      unregisterTagEvent: jest.fn(async () => undefined),
      getTag: jest.fn(async () => null),
      cancelTechnologyRequest: jest.fn(async () => undefined),
      nfcAHandler: {
        transceive: jest.fn(async () => [0x04, 0x00]),
      },
      iso15693HandlerIOS: {
        getSystemInfo: jest.fn(async () => ({
          dsfid: 0,
          afi: 0,
          blockSize: 4,
          blockCount: 64,
          icReference: 1,
        })),
      },
    },
    NfcEvents,
    NfcTech,
    NfcAdapter: { FLAG_READER_NFC_A: 1, FLAG_READER_NFC_B: 2, FLAG_READER_NFC_V: 8, FLAG_READER_SKIP_NDEF_CHECK: 128 },
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: defaultPlatformOS,
  });
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

test.each(['ios', 'android'])(
  'mocked %s interaction - tag info skips NDEF and cleans up repeated calls',
  async os => {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: os });
    const tag = { id: '04010203', tech: 'mifare' };
    (NfcManager.getTag as jest.Mock).mockResolvedValueOnce(tag).mockResolvedValueOnce(tag);
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      root = ReactTestRenderer.create(<App />);
    });
    await ReactTestRenderer.act(async () => {
      root!.root.findByProps({ testID: 'action-get-tag-without-ndef' }).props.onPress();
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(NfcManager.requestTechnology).toHaveBeenCalledWith(
      os === 'ios' ? NfcTech.MifareIOS : NfcTech.NfcA,
      expect.objectContaining({
        isReaderModeEnabled: true,
        readerModeFlags: 129,
      }),
    );
    expect(NfcManager.getTag).toHaveBeenCalledTimes(2);
    expect(NfcManager.getTag).toHaveBeenNthCalledWith(1, { readNdef: false });
    expect(NfcManager.getTag).toHaveBeenNthCalledWith(2, { readNdef: false });
    expect(NfcManager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
    expect(root!.root.findAllByProps({ testID: 'android-nfc-scan-prompt' })).toHaveLength(0);
  },
);

test('mocked tag info failure still awaits cleanup', async () => {
  (NfcManager.getTag as jest.Mock).mockRejectedValueOnce(new Error('tag lost'));
  let root: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(async () => {
    root!.root.findByProps({ testID: 'action-get-tag-without-ndef' }).props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(NfcManager.getTag).toHaveBeenCalledTimes(1);
  expect(NfcManager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
});

test.each(['', '01020304\n', 'G1020304'])('mocked NTAG215 auth rejects invalid input before NFC starts: %j', async password => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => { root = ReactTestRenderer.create(<App />); });
  root!.root.findByProps({ testID: 'ntag215-password' }).props.onChangeText(password);
  await ReactTestRenderer.act(async () => {
    root!.root.findByProps({ testID: 'action-ntag215-auth-read' }).props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(NfcManager.start).not.toHaveBeenCalled();
  expect(NfcManager.requestTechnology).not.toHaveBeenCalled();
  expect(verifyNtag215ReadOption).not.toHaveBeenCalled();
});

test('mocked NTAG215 auth ignores rapid taps until cleanup finishes', async () => {
  let finishAuth: (() => void) | undefined;
  let finishCleanup: (() => void) | undefined;
  (verifyNtag215ReadOption as jest.Mock).mockImplementationOnce(() => new Promise<void>(resolve => { finishAuth = resolve; }));
  (NfcManager.cancelTechnologyRequest as jest.Mock).mockImplementationOnce(() => new Promise<void>(resolve => { finishCleanup = resolve; }));
  let root: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => { root = ReactTestRenderer.create(<App />); });
  root!.root.findByProps({ testID: 'ntag215-password' }).props.onChangeText('01020304');
  const button = root!.root.findByProps({ testID: 'action-ntag215-auth-read' });
  await ReactTestRenderer.act(async () => {
    button.props.onPress();
    button.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(NfcManager.start).toHaveBeenCalledTimes(1);
  expect(NfcManager.requestTechnology).toHaveBeenCalledTimes(1);
  expect(verifyNtag215ReadOption).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(async () => {
    finishAuth?.();
    await new Promise(resolve => setTimeout(resolve, 0));
    button.props.onPress();
  });
  expect(NfcManager.start).toHaveBeenCalledTimes(1);
  expect(NfcManager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
  await ReactTestRenderer.act(async () => {
    finishCleanup?.();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
});

test.each([false, true])('mocked NTAG215 auth awaits cleanup on failure=%s', async fails => {
  let root: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => { root = ReactTestRenderer.create(<App />); });
  const input = root!.root.findByProps({ testID: 'ntag215-password' });
  expect(input.props.secureTextEntry).toBe(true);
  input.props.onChangeText('01020304');
  if (fails) {
    (verifyNtag215ReadOption as jest.Mock).mockRejectedValueOnce(new Error('Authentication failed'));
  }
  await ReactTestRenderer.act(async () => {
    root!.root.findByProps({ testID: 'action-ntag215-auth-read' }).props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(verifyNtag215ReadOption).toHaveBeenCalledWith('01020304', expect.any(Function));
  expect(NfcManager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
  // A second tap must not reuse the previous password.
  await ReactTestRenderer.act(async () => {
    root!.root.findByProps({ testID: 'action-ntag215-auth-read' }).props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });
  expect(verifyNtag215ReadOption).toHaveBeenCalledTimes(1);
});

test('mocked interaction - request NfcA + transceive([0x30, 0x00])', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });

  const nfcATransceiveButton = root!.root.findByProps({
    testID: 'action-request-nfca-transceive',
  });

  await ReactTestRenderer.act(async () => {
    nfcATransceiveButton.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(NfcManager.requestTechnology).toHaveBeenCalledWith(NfcTech.NfcA, {
    alertMessage: 'Ready to scan NfcA tag',
  });
  expect(NfcManager.nfcAHandler.transceive).toHaveBeenCalledWith([0x30, 0x00]);
});

test('mocked Android interaction - keeps scan prompt until cleanup completes', async () => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });

  let resolveRequest: (() => void) | undefined;
  (NfcManager.requestTechnology as jest.Mock).mockImplementationOnce(
    () =>
      new Promise<void>(resolve => {
        resolveRequest = resolve;
      }),
  );

  let root: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });

  const requestButton = root!.root.findByProps({
    testID: 'action-request-ndef-get-tag',
  });

  await ReactTestRenderer.act(async () => {
    requestButton.props.onPress();
  });

  expect(
    root!.root.findAllByProps({ testID: 'android-nfc-scan-prompt' }),
  ).not.toHaveLength(0);

  await ReactTestRenderer.act(async () => {
    resolveRequest?.();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(
    root!.root.findAllByProps({ testID: 'android-nfc-scan-prompt' }),
  ).not.toHaveLength(0);
  expect(
    root!.root.findAll(node => node.props.children === 'Tag Connected'),
  ).not.toHaveLength(0);

  const doneButton = root!.root.findAllByProps({
    testID: 'android-nfc-scan-prompt-cancel',
  })[0];

  await ReactTestRenderer.act(async () => {
    doneButton.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(NfcManager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
  expect(
    root!.root.findAllByProps({ testID: 'android-nfc-scan-prompt' }),
  ).toHaveLength(0);
});

test('mocked interaction - request Iso15693 + getSystemInfo(0)', async () => {
  let root: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });

  const iso15693Button = root!.root.findByProps({
    testID: 'action-request-iso15693-systeminfo',
  });

  await ReactTestRenderer.act(async () => {
    iso15693Button.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(NfcManager.requestTechnology).toHaveBeenCalledWith(
    NfcTech.Iso15693IOS,
    {
      alertMessage: 'Ready to scan Iso15693 tag',
    },
  );
  expect(NfcManager.iso15693HandlerIOS.getSystemInfo).toHaveBeenCalledWith(0);
});

test('mocked Android interaction - cleans up failed NfcA I/O before NDEF recovery', async () => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  (NfcManager.nfcAHandler.transceive as jest.Mock).mockRejectedValueOnce(
    new Error('Transceive failed'),
  );

  let root: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });

  const failedIoButton = root!.root.findByProps({
    testID: 'action-test-failed-io-recovery',
  });

  await ReactTestRenderer.act(async () => {
    failedIoButton.props.onPress();
    await new Promise(resolve => setTimeout(resolve, 0));
  });

  expect(NfcManager.nfcAHandler.transceive).toHaveBeenCalledWith([0x30]);
  expect(NfcManager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
  expect(NfcManager.requestTechnology).toHaveBeenNthCalledWith(1, NfcTech.NfcA, {
    alertMessage: 'Failed I/O test: scan the NfcA tag',
  });
  expect(NfcManager.requestTechnology).toHaveBeenNthCalledWith(2, NfcTech.Ndef, {
    alertMessage: 'Failed-I/O recovery: scan the NDEF tag',
  });
  expect(NfcManager.getTag).toHaveBeenCalledTimes(1);
});

test('mocked Android interaction - unregisters before restoring DiscoverTag listener', async () => {
  jest.useFakeTimers();
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });

  let root: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });

  const listenerRemovalButton = root!.root.findByProps({
    testID: 'action-test-removed-discover-tag-listener',
  });

  await ReactTestRenderer.act(async () => {
    listenerRemovalButton.props.onPress();
    await Promise.resolve();
  });
  expect(NfcManager.registerTagEvent).toHaveBeenCalledTimes(1);

  await ReactTestRenderer.act(async () => {
    jest.advanceTimersByTime(8000);
    await Promise.resolve();
    await Promise.resolve();
  });

  expect(NfcManager.unregisterTagEvent).toHaveBeenCalledTimes(1);
  expect(NfcManager.registerTagEvent).toHaveBeenCalledTimes(2);
  expect(NfcManager.setEventListener).toHaveBeenCalledWith(
    'NfcManagerDiscoverTag',
    null,
  );
  jest.useRealTimers();
});
