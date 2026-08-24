jest.mock('../src/NativeNfcManager');

import {Platform} from 'react-native';
import {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
} from '../src/NativeNfcManager';
import * as NfcError from '../src/NfcError';

describe('NfcManager (ios)', () => {
  Platform.setOS('ios');
  const NfcManagerModule = require('../src/index');
  const NfcManager = NfcManagerModule.default;
  const {NfcEvents, NfcErrorIOS, NfcTech} = NfcManagerModule;
  const lastNativeCall = () =>
    callNative.mock.calls[callNative.mock.calls.length - 1];

  test('constructor', () => {
    expect(Platform.OS).toBe('ios');
    // the NfcManager instance doest exist
    expect(!!NfcManager).toEqual(true);
  });

  test('register native events', () => {
    for (const evtName of [NfcEvents.DiscoverTag, NfcEvents.SessionClosed]) {
      let hit = false;
      for (const mockCall of NfcManagerEmitter.addListener.mock.calls) {
        if (mockCall[0] === evtName) {
          hit = true;
          break;
        }
      }

      if (!hit) {
        // this native event is not registered, treat as error
        expect(true).toBe(false);
      }
    }
  });

  test('API capability', () => {
    expect(typeof NfcManager.start).toBe('function');
    expect(typeof NfcManager.isSupported).toBe('function');
    expect(typeof NfcManager.setEventListener).toBe('function');
    expect(typeof NfcManager.registerTagEvent).toBe('function');
    expect(typeof NfcManager.unregisterTagEvent).toBe('function');
    expect(typeof NfcManager.getTag).toBe('function');
    expect(typeof NfcManager.requestTechnology).toBe('function');
    expect(typeof NfcManager.cancelTechnologyRequest).toBe('function');
    expect(NfcManager.hello).toBeUndefined();
    expect(NfcManager.echo).toBeUndefined();
  });

  test('API: direct NDEF compatibility methods', async () => {
    await NfcManager.writeNdefMessage([0xd1], {reconnectAfterWrite: true});
    expect(lastNativeCall()).toEqual([
      'writeNdefMessage',
      [[0xd1], {reconnectAfterWrite: true}],
    ]);

    await NfcManager.getNdefMessage();
    expect(lastNativeCall()[0]).toEqual('getNdefMessage');
  });

  test('API: background NDEF compatibility method', async () => {
    callNative.mockResolvedValueOnce({ndefMessage: [0xd1, 0x01]});
    await expect(NfcManager.getBackgroundNdef()).resolves.toEqual([0xd1, 0x01]);
    expect(lastNativeCall()[0]).toEqual('getBackgroundTag');

    callNative.mockResolvedValueOnce(null);
    await expect(NfcManager.getBackgroundNdef()).resolves.toBeNull();
  });

  test('API: ISO 15693 quiet aliases', async () => {
    await NfcManager.iso15693HandlerIOS.stayQuiet();
    expect(lastNativeCall()).toEqual(['iso15693_stayQuiet']);

    await NfcManager.iso15693HandlerIOS.stayQuite();
    expect(lastNativeCall()).toEqual(['iso15693_stayQuiet']);
  });

  test('API: start', () => {
    NfcManager.start();
    expect(lastNativeCall()[0]).toEqual('start');
  });

  test('API: isSupported', () => {
    NfcManager.isSupported('Ndef');
    expect(lastNativeCall()[0]).toEqual('isSupported');
    expect(lastNativeCall()[1]).toEqual(['Ndef']);
  });

  test('API: setEventListener', () => {
    try {
      NfcManager.setEventListener('no-such-event', () => 0);
      expect(false).toBe(true);
    } catch (ex) {
      // should throw an ex if no such event
      expect(true).toBe(true);
    }

    // can receive DiscoverTag event
    const tag1 = {id: '3939889'};
    let tag2 = null;
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
      tag2 = tag;
    });
    NfcManagerEmitter._testTriggerCallback(NfcEvents.DiscoverTag, tag1);
    expect(tag2).toEqual(tag1);

    // can receive SessionClosed event
    let sessionClosed = false;
    NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
      sessionClosed = true;
    });
    NfcManagerEmitter._testTriggerCallback(NfcEvents.SessionClosed, {
      error: 'NFCError:200',
    });
    expect(sessionClosed).toBe(true);

    const backgroundTag = {id: 'background-tag'};
    const onBackgroundTag = jest.fn();
    NfcManager.setEventListener(
      NfcEvents.DiscoverBackgroundTag,
      onBackgroundTag,
    );
    NfcManagerEmitter._testTriggerCallback(
      NfcEvents.DiscoverBackgroundTag,
      backgroundTag,
    );
    expect(onBackgroundTag).toHaveBeenCalledWith(backgroundTag);

    const onSessionClosed = jest.fn();
    NfcManager.setEventListener(NfcEvents.SessionClosed, onSessionClosed);
    NfcManagerEmitter._testTriggerCallback(NfcEvents.SessionClosed, {
      error: 'NFCError:201',
    });
    expect(onSessionClosed).toHaveBeenCalledWith(expect.any(NfcError.Timeout));
  });

  test('API: native success and error results remain observable', async () => {
    const tag = {id: 'tag-success'};
    callNative.mockResolvedValueOnce(tag);
    await expect(NfcManager.getTag()).resolves.toEqual(tag);

    NativeNfcManager.setNextError('NFCError:201', 'getTag');
    await expect(NfcManager.getTag()).rejects.toBeInstanceOf(NfcError.Timeout);
  });

  test('API: registerTagEvent', () => {
    NfcManager.registerTagEvent();
    expect(lastNativeCall()[0]).toEqual('registerTagEvent');
    const options = lastNativeCall()[1][0];
    // check if we pass the default options into native
    expect(options.alertMessage).toEqual('Please tap NFC tags');
    expect(options.invalidateAfterFirstRead).toBe(false);
  });

  test('API: cancelTechnologyRequest', async () => {
    // won't throw any error during cancellation by default
    NativeNfcManager.setNextError('fake-error');
    await NfcManager.cancelTechnologyRequest();

    NativeNfcManager.setNextError('fake-error-again');
    try {
      // default can be overriden by throwOnError
      await NfcManager.cancelTechnologyRequest({throwOnError: true});
    } catch (ex) {
      expect(ex.message).toEqual('fake-error-again');
    }
  });

  test('API: repeated request error reaches a terminal rejection', async () => {
    NativeNfcManager.setNextError('request already active', 'requestTechnology');
    await expect(
      NfcManager.requestTechnology(NfcTech.Ndef),
    ).rejects.toMatchObject({message: 'request already active'});
  });

  test('API: setAlertMessage', () => {
    NfcManager.setAlertMessageIOS('hello');
    expect(lastNativeCall()[0]).toEqual('setAlertMessage');
    expect(lastNativeCall()[1]).toEqual(['hello']);

    NfcManager.setAlertMessage('hello');
    expect(lastNativeCall()[0]).toEqual('setAlertMessage');
    expect(lastNativeCall()[1]).toEqual(['hello']);
  });

  test('NfcErrorIOS', () => {
    expect(NfcErrorIOS.parse({})).toEqual(NfcErrorIOS.errCodes.unknown);
    expect(NfcErrorIOS.parse('nosucherror')).toEqual(
      NfcErrorIOS.errCodes.unknown,
    );
    expect(NfcErrorIOS.parse('NFCError:200')).toEqual(
      NfcErrorIOS.errCodes.userCancel,
    );
  });

  test('NfcError', async () => {
    try {
      NativeNfcManager.setNextError('NFCError:200');
      await NfcManager.requestTechnology(NfcTech.Ndef);
    } catch (ex) {
      if (!(ex instanceof NfcError.UserCancel)) {
        expect(true).toBe(false);
      }

      // for backward capatible
      if (NfcErrorIOS.parse(ex) !== NfcErrorIOS.errCodes.userCancel) {
        expect(true).toBe(false);
      }
    }
  });
});
