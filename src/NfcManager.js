'use strict';
import {Platform} from 'react-native';
import {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
} from './NativeNfcManager';
import {NdefHandler, NdefStatus} from './NfcTech/NdefHandler';

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

const DEFAULT_REGISTER_TAG_EVENT_OPTIONS = {
  alertMessage: 'Please tap NFC tags',
  invalidateAfterFirstRead: false,
  isReaderModeEnabled: false,
  readerModeFlags: 0,
  readerModeDelay: 10,
};

function NotImpl() {
  throw new Error('not implemented');
}

class NfcManagerBase {
  constructor() {
    this._subscribeNativeEvents();
  }

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

  getNdefHandler = () => {
    if (!this._ndefHandler) {
      this._ndefHandler = new NdefHandler();
    }
    return this._ndefHandler;
  };

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

  _subscribeNativeEvents = () => {
    this._subscriptions = {};
    this._clientListeners = {};
    this._subscriptions[NfcEvents.DiscoverTag] = NfcManagerEmitter.addListener(
      NfcEvents.DiscoverTag,
      this._onDiscoverTag,
    );

    if (Platform.OS === 'ios') {
      this._subscriptions[
        NfcEvents.SessionClosed
      ] = NfcManagerEmitter.addListener(
        NfcEvents.SessionClosed,
        this._onSessionClosedIOS,
      );
    }

    if (Platform.OS === 'android') {
      this._subscriptions[
        NfcEvents.StateChanged
      ] = NfcManagerEmitter.addListener(
        NfcEvents.StateChanged,
        this._onStateChangedAndroid,
      );
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

export {
  NfcTech,
  NfcEvents,
  NfcManagerBase,
  NdefStatus,
  DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
};
