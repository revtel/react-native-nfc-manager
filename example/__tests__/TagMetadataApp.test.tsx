/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Platform } from 'react-native';
import App from '../App';
import NfcManager, { NfcTech } from 'react-native-nfc-manager';

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
    NfcAdapter: {
      FLAG_READER_NFC_A: 1,
      FLAG_READER_NFC_B: 2,
      FLAG_READER_NFC_V: 8,
      FLAG_READER_SKIP_NDEF_CHECK: 128,
    },
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

test.each([
  ['nfcv', NfcTech.NfcV, 136],
  ['isodep', NfcTech.IsoDep, 131],
])(
  'Android %s metadata reader cleans up after a failed read',
  async (name, tech, flags) => {
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      value: 'android',
    });
    (NfcManager.getTag as jest.Mock).mockRejectedValueOnce(
      new Error('tag lost'),
    );
    let root: ReactTestRenderer.ReactTestRenderer;
    await ReactTestRenderer.act(() => {
      root = ReactTestRenderer.create(<App />);
    });
    await ReactTestRenderer.act(async () => {
      root!.root
        .findByProps({ testID: `action-read-${name}-metadata` })
        .props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
    expect(NfcManager.requestTechnology).toHaveBeenCalledWith(tech, {
      isReaderModeEnabled: true,
      readerModeFlags: flags,
    });
    expect(NfcManager.cancelTechnologyRequest).toHaveBeenCalledTimes(1);
    expect(
      root!.root.findAllByProps({ testID: 'android-nfc-scan-prompt' }),
    ).toHaveLength(0);
  },
);

test('metadata discovery explicitly polls NFC-A/B/V without NDEF probing and can stop', async () => {
  Object.defineProperty(Platform, 'OS', {
    configurable: true,
    value: 'android',
  });
  let root: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    root = ReactTestRenderer.create(<App />);
  });
  for (const action of ['start', 'stop']) {
    await ReactTestRenderer.act(async () => {
      root!.root
        .findByProps({ testID: `action-${action}-metadata-discovery` })
        .props.onPress();
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    });
  }
  expect(NfcManager.registerTagEvent).toHaveBeenCalledWith({
    isReaderModeEnabled: true,
    readerModeFlags: 139,
  });
  expect(NfcManager.unregisterTagEvent).toHaveBeenCalledTimes(1);
});
