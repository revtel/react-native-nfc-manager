'use strict';
import {Platform} from 'react-native';
import {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
} from './NativeNfcManager';
import {NdefHandler, NdefStatus} from './NfcTech/NdefHandler';
import {NfcAHandler} from './NfcTech/NfcAHandler';
import {NfcVHandler} from './NfcTech/NfcVHandler';
import {IsoDepHandler} from './NfcTech/IsoDepHandler';
import {
  handleNativeException,
  buildNfcExceptionIOS,
  UserCancel,
} from './NfcError';

const NfcEvents = {
  DiscoverTag: 'NfcManagerDiscoverTag',
  DiscoverBackgroundTag: 'NfcManagerDiscoverBackgroundTag',
  SessionClosed: 'NfcManagerSessionClosed',
  StateChanged: 'NfcManagerStateChanged',
} as const;

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
  NdefFormatable: 'NdefFormatable',
} as const;

const DEFAULT_REGISTER_TAG_EVENT_OPTIONS = {
  alertMessage: 'Please tap NFC tags',
  invalidateAfterFirstRead: false,
  isReaderModeEnabled: false,
  readerModeFlags: 0,
  readerModeDelay: 250,
} as const;

type NfcEventName = (typeof NfcEvents)[keyof typeof NfcEvents];
type RegisterTagEventOptions = Partial<typeof DEFAULT_REGISTER_TAG_EVENT_OPTIONS>;
type ClientEventCallback = ((payload: unknown) => void) | null;
type NativeSubscriptionMap = Partial<Record<NfcEventName, {remove: () => void}>>;
type ClientListenerMap = Partial<Record<NfcEventName, ClientEventCallback>>;
type AsyncMethod = (...args: unknown[]) => Promise<unknown>;

function NotImpl() {
  throw new Error('not implemented');
}

async function DoNothing(..._args: unknown[]) {
  // allow derived class to not implment it
}

class NfcManagerBase {
  _subscriptions: NativeSubscriptionMap;
  _clientListeners: ClientListenerMap;
  _ndefHandler: NdefHandler | null;
  _nfcAHandler: NfcAHandler | null;
  _nfcVHandler: NfcVHandler | null;
  _isoDepHandler: IsoDepHandler | null;

  constructor() {
    this._subscriptions = {};
    this._clientListeners = {};
    this._ndefHandler = null;
    this._nfcAHandler = null;
    this._nfcVHandler = null;
    this._isoDepHandler = null;
    this._subscribeNativeEvents();
  }

  hello(str: string) {
    return NativeNfcManager.hello(str);
  }

  async echo(msg: string) {
    return handleNativeException(callNative('echo', [msg]));
  }

  async start() {
    return handleNativeException(callNative('start'));
  }

  async isSupported(tech = '') {
    return handleNativeException(callNative('isSupported', [tech]));
  }

  async registerTagEvent(options: RegisterTagEventOptions = {}) {
    const optionsWithDefault = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    return handleNativeException(
      callNative('registerTagEvent', [optionsWithDefault]),
    );
  }

  async unregisterTagEvent() {
    return handleNativeException(callNative('unregisterTagEvent'));
  }

  async getTag() {
    return handleNativeException(callNative('getTag'));
  }

  setEventListener(name: NfcEventName, callback: ClientEventCallback) {
    const allNfcEvents = Object.keys(NfcEvents).map(
      (k) => NfcEvents[k as keyof typeof NfcEvents],
    );
    if (allNfcEvents.indexOf(name) === -1) {
      throw new Error('no such event');
    }

    this._clientListeners[name] = callback;
  }

  requestTechnology: AsyncMethod = async (..._args: unknown[]) => NotImpl();

  restartTechnologyRequestIOS: AsyncMethod = async (..._args: unknown[]) => NotImpl();

  cancelTechnologyRequest: AsyncMethod = async (..._args: unknown[]) => NotImpl();

  getBackgroundTag: AsyncMethod = async (..._args: unknown[]) => NotImpl();

  clearBackgroundTag: AsyncMethod = async (..._args: unknown[]) => NotImpl();

  setAlertMessage: AsyncMethod = DoNothing;

  getTimeout: AsyncMethod = DoNothing;

  async writeNdefMessage(bytes: number[], options: Record<string, unknown> = {}) {
    return handleNativeException(callNative('writeNdefMessage', [bytes, options]));
  }

  async getNdefMessage() {
    return handleNativeException(callNative('getNdefMessage'));
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

  get nfcVHandler() {
    if (!this._nfcVHandler) {
      this._nfcVHandler = new NfcVHandler();
    }
    return this._nfcVHandler;
  }

  get isoDepHandler() {
    if (!this._isoDepHandler) {
      this._isoDepHandler = new IsoDepHandler();
    }
    return this._isoDepHandler;
  }

  get MIFARE_BLOCK_SIZE() {
    return NativeNfcManager.MIFARE_BLOCK_SIZE as unknown as number;
  }
  get MIFARE_ULTRALIGHT_PAGE_SIZE() {
    return NativeNfcManager.MIFARE_ULTRALIGHT_PAGE_SIZE as unknown as number;
  }
  get MIFARE_ULTRALIGHT_TYPE() {
    return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE as unknown as number;
  }
  get MIFARE_ULTRALIGHT_TYPE_C() {
    return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE_C as unknown as number;
  }
  get MIFARE_ULTRALIGHT_TYPE_UNKNOWN() {
    return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE_UNKNOWN as unknown as number;
  }

  _onDiscoverTag = (tag: unknown) => {
    const callback = this._clientListeners[NfcEvents.DiscoverTag];
    if (callback) {
      callback(tag);
    }
  };

  _onDiscoverBackgroundTag = (tag: unknown) => {
    const callback = this._clientListeners[NfcEvents.DiscoverBackgroundTag];
    if (callback) {
      callback(tag);
    }
  };

  _onSessionClosedIOS = (resp: {error: string}) => {
    const callback = this._clientListeners[NfcEvents.SessionClosed];
    if (callback) {
      const error = buildNfcExceptionIOS(resp.error);
      callback(error instanceof UserCancel ? null : error);
    }
  };

  _onStateChangedAndroid = (state: unknown) => {
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

    this._subscriptions[NfcEvents.DiscoverBackgroundTag] = NfcManagerEmitter.addListener(
      NfcEvents.DiscoverBackgroundTag,
      this._onDiscoverBackgroundTag,
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
