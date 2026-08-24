/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

jest.mock('react-native-nfc-manager', () => {
  const NfcEvents = {
    DiscoverTag: 'NfcManagerDiscoverTag',
    SessionClosed: 'NfcManagerSessionClosed',
  };

  const NfcTech = {
    Ndef: 'Ndef',
    NfcA: 'NfcA',
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
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
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

  expect(NfcManager.requestTechnology).toHaveBeenCalledWith(NfcTech.Iso15693IOS, {
    alertMessage: 'Ready to scan Iso15693 tag',
  });
  expect(NfcManager.iso15693HandlerIOS.getSystemInfo).toHaveBeenCalledWith(0);
});
