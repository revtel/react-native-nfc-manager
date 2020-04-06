'use strict';
import {
  Platform
} from 'react-native'
import ByteParser from './ByteParser'
import NdefParser from './NdefParser'
import Ndef from './ndef-lib'
import {NativeNfcManager, NfcManagerEmitter, callNative} from './NativeNfcManager'

const DEFAULT_REGISTER_TAG_EVENT_OPTIONS = {
  alertMessage: 'Please tap NFC tags',
  invalidateAfterFirstRead: false,
  isReaderModeEnabled: false,
  readerModeFlags: 0,
};

const NfcEvents = {
  DiscoverTag: 'NfcManagerDiscoverTag',
  SessionClosed: 'NfcManagerSessionClosed',
  StateChanged: 'NfcManagerStateChanged',
}

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
}

const NfcAdapter = {
  FLAG_READER_NFC_A: 0x1,
  FLAG_READER_NFC_B: 0x2,
  FLAG_READER_NFC_F: 0x4,
  FLAG_READER_NFC_V: 0x8,
  FLAG_READER_NFC_BARCODE: 0x10,
  FLAG_READER_SKIP_NDEF_CHECK: 0x80,
  FLAG_READER_NO_PLATFORM_SOUNDS: 0x100,
};

const Nfc15693RequestFlagIOS = {
  DualSubCarriers: (1 << 0),
  HighDataRate: (1 << 1),
  ProtocolExtension: (1 << 3),
  Select: (1 << 4),
  Address: (1 << 5),
  Option: (1 << 6),
};

class Iso15693HandlerIOS {
  getSystemInfo(requestFlag) {
    return callNative('iso15693_getSystemInfo', [requestFlag]);
  }

  readSingleBlock({flags, blockNumber}) {
    return callNative('iso15693_readSingleBlock', [{flags, blockNumber}]);
  }

  writeSingleBlock({flags, blockNumber, dataBlock}) {
    return callNative('iso15693_writeSingleBlock', [{flags, blockNumber, dataBlock}]);
  }

  lockBlock({flags, blockNumber}) {
    return callNative('iso15693_lockBlock', [{flags, blockNumber}]);
  }

  writeAFI({flags, afi}) {
    return callNative('iso15693_writeAFI', [{flags, afi}]);
  }

  lockAFI({flags}) {
    return callNative('iso15693_lockAFI', [{flags}]);
  }

  writeDSFID({flags, dsfid}) {
    return callNative('iso15693_writeDSFID', [{flags, dsfid}]);
  }

  lockDSFID({flags}) {
    return callNative('iso15693_lockDSFID', [{flags}]);
  }

  resetToReady({flags}) {
    return callNative('iso15693_resetToReady', [{flags}]);
  }

  select({flags}) {
    return callNative('iso15693_select', [{flags}]);
  }

  stayQuite() {
    return callNative('iso15693_stayQuiet');
  }

  customCommand({flags, customCommandCode, customRequestParameters}) {
    return callNative('iso15693_customCommand', [{flags, customCommandCode, customRequestParameters}]);
  }

  extendedReadSingleBlock({flags, blockNumber}) {
    return callNative('iso15693_extendedReadSingleBlock', [{flags, blockNumber}]);
  }

  extendedWriteSingleBlock({flags, blockNumber, dataBlock}) {
    return callNative('iso15693_extendedWriteSingleBlock', [{flags, blockNumber, dataBlock}]);
  }

  extendedLockBlock({flags, blockNumber}) {
    return callNative('iso15693_extendedLockBlock', [{flags, blockNumber}]);
  }
}

class NfcManager {
  constructor() {
    this.cleanUpTagRegistration = false;
    this._subscribeNativeEvents();

    if (Platform.OS === 'ios') {
      this._iso15693HandlerIOS = new Iso15693HandlerIOS();
    }

    // legacy stuff
    this._clientTagDiscoveryListener = null;
    this._clientSessionClosedListener = null;
    this._subscription = null;
  }

  // -------------------------------------
  // public for both platforms
  // -------------------------------------
  setEventListener = (name, callback) => {
    const allNfcEvents = Object.keys(NfcEvents).map(k => NfcEvents[k]);
    if (allNfcEvents.indexOf(name) === -1) {
      throw new Error('no such event');
    }

    this._clientListeners[name] = callback;
  }

  get MIFARE_BLOCK_SIZE() { return NativeNfcManager.MIFARE_BLOCK_SIZE };
	get MIFARE_ULTRALIGHT_PAGE_SIZE() { return NativeNfcManager.MIFARE_ULTRALIGHT_PAGE_SIZE };
	get MIFARE_ULTRALIGHT_TYPE() { return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE };
	get MIFARE_ULTRALIGHT_TYPE_C() { return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE_C };
	get MIFARE_ULTRALIGHT_TYPE_UNKNOWN() { return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE_UNKNOWN };

  start = () => callNative('start');

  isSupported = (tech = '') => callNative('isSupported', [tech]);

  registerTagEvent = (options = {}) => {
    const optionsWithDefault = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    return callNative('registerTagEvent', [optionsWithDefault]);
  }

  unregisterTagEvent = () => callNative('unregisterTagEvent');

  getTag = () => callNative('getTag');

  requestTechnology = async (tech, options={}) => {
    try {
      if (typeof tech === 'string') {
        tech = [tech];
      }

      let sessionAvailable = false;

      // check if required session is available
      if (Platform.OS === 'ios') {
        sessionAvailable = await this._isSessionExAvailableIOS();
      } else {
        sessionAvailable = await this._hasTagEventRegistrationAndroid();
      }

      // make sure we do register for tag event 
      if (!sessionAvailable) {
        if (Platform.OS === 'ios') {
          await this._registerTagEventExIOS(options);
        } else {
          await this.registerTagEvent(options);
        }

        this.cleanUpTagRegistration = true;
      }

      return callNative('requestTechnology', [tech]);
    } catch (ex) {
      throw ex;
    }
  }

  cancelTechnologyRequest = async () => {
    if (!this.cleanUpTagRegistration) {
      await callNative('cancelTechnologyRequest');
      return;
    }

    this.cleanUpTagRegistration = false;

    if (Platform.OS === 'ios') {
      let sessionAvailable = false;

      // because we don't know which tech currently requested
      // so we try both, and perform early return when hitting any
      sessionAvailable = await this._isSessionExAvailableIOS();
      if (sessionAvailable) {
        await this._unregisterTagEventExIOS();
        return;
      }

      sessionAvailable = await this._isSessionAvailableIOS();
      if (sessionAvailable) {
        await this.unregisterTagEvent();
        return;
      }
    } else {
      await callNative('cancelTechnologyRequest');
      await this.unregisterTagEvent();
      return;
    }
  }

  // -------------------------------------
  // public only for Android
  // -------------------------------------
  isEnabled = () => callNative('isEnabled');

  goToNfcSetting = () => callNative('goToNfcSetting');

  getLaunchTagEvent = () => callNative('getLaunchTagEvent');

  setNdefPushMessage = (bytes) => callNative('setNdefPushMessage', [bytes]);

  // -------------------------------------
  // public only for iOS
  // -------------------------------------
  setAlertMessageIOS = (alertMessage) => {
    if (Platform.OS !== 'ios') {
      return Promise.resolve(); //no-op
    }
    callNative('setAlertMessage', [alertMessage]);
  }

  invalidateSessionIOS = () => callNative('invalidateSession');

  invalidateSessionWithErrorIOS = (errorMessage='Error') => callNative('invalidateSessionWithError', [errorMessage]);

  // -------------------------------------
  // NfcTech.Ndef API
  // -------------------------------------
  writeNdefMessage = (bytes) => callNative('writeNdefMessage', [bytes]);

  getNdefMessage = () => callNative('getNdefMessage');

  // -------------------------------------
  // (android) NfcTech.Ndef API
  // -------------------------------------
  getCachedNdefMessageAndroid = () => callNative('getCachedNdefMessage');

  makeReadOnlyAndroid = () => callNative('makeReadOnly');

  // -------------------------------------
  // (android) tNfcTech.MifareClassic API
  // -------------------------------------
  mifareClassicAuthenticateA = (sector, key) => {
    if (!key || !Array.isArray(key) || key.length !== 6) {
      return Promise.reject('key should be an Array[6] of integers (0 - 255)');
    }

    return callNative('mifareClassicAuthenticateA', [sector, key]);
  }

  mifareClassicAuthenticateB = (sector, key) => {
    if (!key || !Array.isArray(key) || key.length !== 6) {
      return Promise.reject('key should be an Array[6] of integers (0 - 255)');
    }

    return callNative('mifareClassicAuthenticateB', [sector, key]);
  }

  mifareClassicGetBlockCountInSector = (sector) => callNative('mifareClassicGetBlockCountInSector', [sector]);

  mifareClassicGetSectorCount = () => callNative('mifareClassicGetSectorCount');

  mifareClassicSectorToBlock = (sector) => callNative('mifareClassicSectorToBlock', [sector]);

  mifareClassicReadBlock = (block) => callNative('mifareClassicReadBlock', [block]);

  mifareClassicReadSector = (sector) => callNative('mifareClassicReadSector', [sector]);

  mifareClassicWriteBlock = (block, data) => {
    if (!data || !Array.isArray(data) || data.length !== this.MIFARE_BLOCK_SIZE) {
      return Promise.reject(`data should be a non-empty Array[${this.MIFARE_BLOCK_SIZE}] of integers (0 - 255)`);
    }

    return callNative('mifareClassicWriteBlock', [block, data]);
  }

  // -------------------------------------
  // (android) NfcTech.MifareUltralight API
  // -------------------------------------
  mifareUltralightReadPages = (pageOffset) => callNative('mifareUltralightReadPages', [pageOffset]);

  mifareUltralightWritePage = (pageOffset, data) => {
    if (!data || !Array.isArray(data) || data.length !== this.MIFARE_ULTRALIGHT_PAGE_SIZE) {
      return Promise.reject(`data should be a non-empty Array[${this.MIFARE_ULTRALIGHT_PAGE_SIZE}] of integers (0 - 255)`);
    }

    return callNative('mifareUltralightWritePage', [pageOffset, data]);
  }

  // -------------------------------------
  // (android) setTimeout works for NfcA, NfcF, IsoDep, MifareClassic, MifareUltralight
  // -------------------------------------
  setTimeout = (timeout) => callNative('setTimeout', [timeout]);

  connect = (techs) => callNative('connect', [techs]);

  close = () => callNative('close');

  // -------------------------------------
  // (android) transceive works for NfcA, NfcB, NfcF, NfcV, IsoDep and MifareUltralight
  // -------------------------------------
  transceive = (bytes) => callNative('transceive', [bytes]);

  getMaxTransceiveLength = () => callNative('getMaxTransceiveLength');

  // -------------------------------------
  // (iOS) NfcTech.MifareIOS API
  // -------------------------------------
  sendMifareCommandIOS = (bytes) => callNative('sendMifareCommand', [bytes]);

  // -------------------------------------
  // (iOS) NfcTech.Iso15693IOS API
  // -------------------------------------
  getIso15693HandlerIOS = () => this._iso15693HandlerIOS;

  // -------------------------------------
  // (iOS) NfcTech.IsoDep API
  // -------------------------------------
  sendCommandAPDUIOS = (bytesOrApdu) => {
    if (Platform.OS !== 'ios') {
      return Promise.reject('not implemented');
    }

    if (Array.isArray(bytesOrApdu)) {
      const bytes = bytesOrApdu;
      return new Promise((resolve, reject) => {
        NativeNfcManager.sendCommandAPDUBytes(bytes, (err, response, sw1, sw2) => {
          if (err) {
            reject(err);
          } else {
            resolve({response, sw1, sw2});
          }
        });
      })
    } else {
      const apdu = bytesOrApdu;
      return new Promise((resolve, reject) => {
        NativeNfcManager.sendCommandAPDU(apdu, (err, response, sw1, sw2) => {
          if (err) {
            reject(err);
          } else {
            resolve({response, sw1, sw2});
          }
        });
      })
    }
  }

  // -------------------------------------
  // private
  // -------------------------------------
  _subscribeNativeEvents = () => {
    this._subscriptions = {}
    this._clientListeners = {};
    this._subscriptions[NfcEvents.DiscoverTag] = NfcManagerEmitter.addListener(
      NfcEvents.DiscoverTag, this._onDiscoverTag
    );

    if (Platform.OS === 'ios') {
      this._subscriptions[NfcEvents.SessionClosed] = NfcManagerEmitter.addListener(
        NfcEvents.SessionClosed, this._onSessionClosedIOS
      );
    }

    if (Platform.OS === 'android') {
      this._subscriptions[NfcEvents.StateChanged] = NfcManagerEmitter.addListener(
        NfcEvents.StateChanged, this._onStateChangedAndroid
      );
    }
  }

  _onDiscoverTag = tag => {
    const callback = this._clientListeners[NfcEvents.DiscoverTag];
    if (callback) {
      callback(tag);
    }
  }

  _onSessionClosedIOS = () => {
    const callback = this._clientListeners[NfcEvents.SessionClosed];
    if (callback) {
      callback();
    }
  }

  _onStateChangedAndroid = state => {
    const callback = this._clientListeners[NfcEvents.StateChanged];
    if (callback) {
      callback(state);
    }
  }

  // -------------------------------------
  // Android private
  // -------------------------------------
  _hasTagEventRegistrationAndroid = () => callNative('hasTagEventRegistration');

  // -------------------------------------
  // iOS private
  // -------------------------------------
  _isSessionAvailableIOS = () => callNative('isSessionAvailable');

  _isSessionExAvailableIOS = () => callNative('isSessionExAvailable');

  _registerTagEventExIOS = (options = {}) => {
    const optionsWithDefault = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    return callNative('registerTagEventEx', [optionsWithDefault]);
  }

  _unregisterTagEventExIOS = () => callNative('unregisterTagEventEx');

  // -------------------------------------
  // deprecated APIs 
  // -------------------------------------
  requestNdefWrite = (bytes, {format=false, formatReadOnly=false}={}) => callNative('requestNdefWrite', [bytes, {format, formatReadOnly}]);

  cancelNdefWrite = () => callNative('cancelNdefWrite');
}

export default new NfcManager();

export {
  ByteParser,
  NdefParser,
  NfcTech,
  NfcEvents,
  NfcAdapter,
  Ndef,
  Nfc15693RequestFlagIOS,
}
