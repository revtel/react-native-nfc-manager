'use strict';
import {
  NativeModules,
  NativeEventEmitter,
  Platform
} from 'react-native'
import ByteParser from './ByteParser'
import NdefParser from './NdefParser'
import Ndef from './ndef-lib'

const NativeNfcManager = NativeModules.NfcManager;
const NfcManagerEmitter = new NativeEventEmitter(NativeNfcManager);

const DEFAULT_REGISTER_TAG_EVENT_OPTIONS = {
  invalidateAfterFirstRead: false,
  isReaderModeEnabled: false,
  readerModeFlags: 0,
};

const Events = {
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

const LOG = 'NfcManagerJs';

class NfcManager {
  constructor() {
    this._clientTagDiscoveryListener = null;
    this._clientSessionClosedListener = null;
    this._session = null;
    this._subscription = null;
  }

  // Constants, by the lack of ES7 we do it with getters
  get MIFARE_BLOCK_SIZE() { return NativeNfcManager.MIFARE_BLOCK_SIZE };
	get MIFARE_ULTRALIGHT_PAGE_SIZE() { return NativeNfcManager.MIFARE_ULTRALIGHT_PAGE_SIZE };
	get MIFARE_ULTRALIGHT_TYPE() { return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE };
	get MIFARE_ULTRALIGHT_TYPE_C() { return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE_C };
	get MIFARE_ULTRALIGHT_TYPE_UNKNOWN() { return NativeNfcManager.MIFARE_ULTRALIGHT_TYPE_UNKNOWN };

  start({ onSessionClosedIOS } = {}) {
    return new Promise((resolve, reject) => {
      NativeNfcManager.start((err, result) => {
        if (err) {
          reject(err);
        } else {
          if (Platform.OS === 'ios') {
            this._clientSessionClosedListener = onSessionClosedIOS;
            this._session = NfcManagerEmitter.addListener(Events.SessionClosed, this._handleSessionClosed);
          } else {
            this._session = {
              remove: () => { },
            };
          }
          resolve();
        }
      });
    })
  }

  stop() {
    if (this._session) {
      this._session.remove();
      this._session = null;
    }
    return Promise.resolve();
  }

  isSupported(tech = ''){
    return new Promise((resolve, reject) => {
      NativeNfcManager.isSupported(tech, (err,result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  isEnabled() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.isEnabled((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result)
        }
      })
    })
  }

  goToNfcSetting() {
    return new Promise((resolve, reject) => {
      NativeNfcManager.goToNfcSetting((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  getLaunchTagEvent() {
    return new Promise((resolve, reject) => {
      NativeNfcManager.getLaunchTagEvent((err, tag) => {
        if (err) {
          reject(err);
        } else {
          resolve(tag)
        }
      });
    })
  }

  registerTagEvent(listener, alertMessage = '', options = {}) {
    // Support legacy `invalidateAfterFirstRead` boolean
    if (options === true || options === false) {
      options = {
        invalidateAfterFirstRead: options,
      };
    }

    options = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    if (!this._subscription) {
      return new Promise((resolve, reject) => {
        NativeNfcManager.registerTagEvent(
          alertMessage,
          options,
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              this._clientTagDiscoveryListener = listener;
              this._subscription = NfcManagerEmitter.addListener(
                Events.DiscoverTag,
                this._handleDiscoverTag,
              );
              resolve(result);
            }
          },
        );
      });
    }
    return Promise.resolve();
  }

  unregisterTagEvent() {
    if (this._subscription) {
      this._clientTagDiscoveryListener = null;
      this._subscription.remove();
      this._subscription = null;
      return new Promise((resolve, reject) => {
        NativeNfcManager.unregisterTagEvent((err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result)
          }
        })
      })
    }
    return Promise.resolve();
  }

  _handleDiscoverTag = tag => {
    if (this._clientTagDiscoveryListener) {
      this._clientTagDiscoveryListener(tag);
    }
  }

  _handleSessionClosed = () => {
    if (this._subscription) {
        this._subscription.remove();
        this._subscription = null;
    }
    this._clientTagDiscoveryListener = null;
    this._clientSessionClosedListener && this._clientSessionClosedListener();
  }

  onStateChanged(listener) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return Promise.resolve(NfcManagerEmitter.addListener(Events.StateChanged, listener));
  }

  setNdefPushMessage(bytes) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.setNdefPushMessage(bytes, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  // -------------------------------------
  // Ndef Writing request API  
  // -------------------------------------
  requestNdefWrite(bytes, {format=false, formatReadOnly=false}={}) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.requestNdefWrite(bytes, {format, formatReadOnly}, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  cancelNdefWrite() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.cancelNdefWrite((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  // -------------------------------------
  // Nfc Tech request API  
  // -------------------------------------
  requestTechnology(tech) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.requestTechnology(tech, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  cancelTechnologyRequest() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.cancelTechnologyRequest((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  closeTechnology() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.closeTechnology((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  getTag() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.getTag((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  // -------------------------------------
  // NfcTech.Ndef API
  // -------------------------------------
  writeNdefMessage(bytes) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.writeNdefMessage(bytes, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  getNdefMessage() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.getNdefMessage((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  getCachedNdefMessage() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.getCachedNdefMessage((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  makeReadOnly() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.makeReadOnly((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }


  // -------------------------------------
  // NfcTech.MifareClassic API
  // -------------------------------------
  mifareClassicAuthenticateA(sector, key) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    if (!key || !Array.isArray(key) || key.length !== 6) {
      return Promise.reject('key should be an Array[6] of integers (0 - 255)');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareClassicAuthenticateA(sector, key, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  mifareClassicAuthenticateB(sector, key) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    if (!key || !Array.isArray(key) || key.length !== 6) {
      return Promise.reject('key should be an Array[6] of integers (0 - 255)');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareClassicAuthenticateB(sector, key, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  mifareClassicGetBlockCountInSector(sector) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareClassicGetBlockCountInSector(sector, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  mifareClassicGetSectorCount() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareClassicGetSectorCount((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  mifareClassicSectorToBlock(sector) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareClassicSectorToBlock(sector, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  mifareClassicReadBlock(block) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareClassicReadBlock(block, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  mifareClassicReadSector(sector) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareClassicReadSector(sector, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  mifareClassicWriteBlock(block, data) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    if (!data || !Array.isArray(data) || data.length !== this.MIFARE_BLOCK_SIZE) {
      return Promise.reject(`data should be a non-empty Array[${this.MIFARE_BLOCK_SIZE}] of integers (0 - 255)`);
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareClassicWriteBlock(block, data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  // -------------------------------------
  // NfcTech.MifareUltralight API
  // -------------------------------------
  mifareUltralightReadPages(pageOffset) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareUltralightReadPages(pageOffset, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  mifareUltralightWritePage(pageOffset, data) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    if (!data || !Array.isArray(data) || data.length !== this.MIFARE_ULTRALIGHT_PAGE_SIZE) {
      return Promise.reject(`data should be a non-empty Array[${this.MIFARE_ULTRALIGHT_PAGE_SIZE}] of integers (0 - 255)`);
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.mifareUltralightWritePage(pageOffset, data, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  // -------------------------------------
  // setTimeout works for NfcA, NfcF, IsoDep, MifareClassic, MifareUltralight
  // -------------------------------------
  setTimeout(timeout) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.setTimeout(timeout, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  // -------------------------------------
  // transceive works for NfcA, NfcB, NfcF, NfcV, IsoDep and MifareUltralight
  // -------------------------------------
  transceive(bytes) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.transceive(bytes, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  getMaxTransceiveLength() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.getMaxTransceiveLength((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }
}

export default new NfcManager();

export {
  ByteParser,
  NdefParser,
  NfcTech,
  NfcAdapter,
  Ndef,
}
