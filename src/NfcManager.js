'use strict';
import {Platform} from 'react-native';
import {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
} from './NativeNfcManager';

const DEFAULT_REGISTER_TAG_EVENT_OPTIONS = {
  alertMessage: 'Please tap NFC tags',
  invalidateAfterFirstRead: false,
  isReaderModeEnabled: false,
  readerModeFlags: 0,
  readerModeDelay: 10,
};

const NfcEvents = {
  DiscoverTag: 'NfcManagerDiscoverTag',
  SessionClosed: 'NfcManagerSessionClosed',
  StateChanged: 'NfcManagerStateChanged',
};

const NfcTech = {
  Ndef: 'Ndef',
  NfcA: 'NfcA',
  NfcB: 'NfcB',
  NfcF: 'NfcF',
  NfcV: 'NfcV',
  IsoDep: 'IsoDep',
  MifareClassic: 'MifareClassic',
  MifareUltralight: 'MifareUltralight',
  MifareIOS: 'mifare',
  Iso15693IOS: 'iso15693',
  FelicaIOS: 'felica',
};

function NotImpl() {
  throw new Error('not implemented');
}

class NfcManagerBase {
  start = () => callNative('start');

  isSupported = (tech = '') => callNative('isSupported', [tech]);

  setEventListener = (name, callback) => {
    const allNfcEvents = Object.keys(NfcEvents).map((k) => NfcEvents[k]);
    if (allNfcEvents.indexOf(name) === -1) {
      throw new Error('no such event');
    }

    this._clientListeners[name] = callback;
  };

  registerTagEvent = (options = {}) => {
    const optionsWithDefault = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    return callNative('registerTagEvent', [optionsWithDefault]);
  };

  unregisterTagEvent = () => callNative('unregisterTagEvent');

  getTag = () => callNative('getTag');

  requestTechnology = NotImpl;

  cancelTechnologyRequest = NotImpl;

  writeNdefMessage = (bytes) => callNative('writeNdefMessage', [bytes]);

  getNdefMessage = () => callNative('getNdefMessage');

  _onDiscoverTag = (tag) => {
    const callback = this._clientListeners[NfcEvents.DiscoverTag];
    if (callback) {
      callback(tag);
    }
  };

  _onSessionClosedIOS = () => {
    const callback = this._clientListeners[NfcEvents.SessionClosed];
    if (callback) {
      callback();
    }
  };

  _onStateChangedAndroid = (state) => {
    const callback = this._clientListeners[NfcEvents.StateChanged];
    if (callback) {
      callback(state);
    }
  };

  get MIFARE_BLOCK_SIZE() {
    return NativeNfcManager.MIFARE_BLOCK_SIZE;
  }
  get MIFARE_ULTRALIGHT_PAGE_SIZE() {
    return NativeNfcManager.MIFARE_ULTRALIGHT_PAGE_SIZE;
  }
  get MIFARE_ULTRALIGHT_TYPE() {
    return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE;
  }
  get MIFARE_ULTRALIGHT_TYPE_C() {
    return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE_C;
  }
  get MIFARE_ULTRALIGHT_TYPE_UNKNOWN() {
    return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE_UNKNOWN;
  }
}

export {NfcTech, NfcEvents, NfcManagerBase, DEFAULT_REGISTER_TAG_EVENT_OPTIONS};
