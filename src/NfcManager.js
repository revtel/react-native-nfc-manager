'use strict';
import {Platform} from 'react-native';
import {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
} from './NativeNfcManager';
import {NdefHandler, NdefStatus} from './NfcTech/NdefHandler';
import {NfcAHandler} from './NfcTech/NfcAHandler';
import {IsoDepHandler} from './NfcTech/IsoDepHandler';

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

  async start() {
    return callNative('start');
  }

  async isSupported(tech = '') {
    return callNative('isSupported', [tech]);
  }

  async registerTagEvent(options = {}) {
    const optionsWithDefault = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    return callNative('registerTagEvent', [optionsWithDefault]);
  }

  async unregisterTagEvent() {
    return callNative('unregisterTagEvent');
  }

  async getTag() {
    return callNative('getTag');
  }

  setEventListener(name, callback) {
    const allNfcEvents = Object.keys(NfcEvents).map((k) => NfcEvents[k]);
    if (allNfcEvents.indexOf(name) === -1) {
      throw new Error('no such event');
    }

    this._clientListeners[name] = callback;
  }

  requestTechnology = NotImpl;

  cancelTechnologyRequest = NotImpl;

  async writeNdefMessage(bytes) {
    return callNative('writeNdefMessage', [bytes]);
  }

  async getNdefMessage() {
    return callNative('getNdefMessage');
  }

  get ndefHandler() {
    if (!this._ndefHandler) {
      this._ndefHandler = new NdefHandler();
    }
    return this._ndefHandler;
  }

  get nfcAHandler() {
    if (!this._nfcAHandler) {
      this._nfcAHandler = new NfcAHandler();
    }
    return this._nfcAHandler;
  }

  get isoDepHandler() {
    if (!this._isoDepHandler) {
      this._isoDepHandler = new IsoDepHandler();
    }
    return this._isoDepHandler;
  }

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
}

export {
  NfcTech,
  NfcEvents,
  NfcManagerBase,
  NdefStatus,
  DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
};
