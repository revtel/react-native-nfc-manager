'use strict';
import {
  Platform
} from 'react-native'
import ByteParser from './ByteParser'
import NdefParser from './NdefParser'
import Ndef from './ndef-lib'
import {NativeNfcManager, NfcManagerEmitter} from './NativeNfcManager'

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

class NfcManager {
  constructor() {
    this.cleanUpTagRegistration = false;
    this._subscribeNativeEvents();

    // legacy stuff
    this._clientTagDiscoveryListener = null;
    this._clientSessionClosedListener = null;
    this._subscription = null;
  }

  // -------------------------------------
  // public 
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

  start() {
    return new Promise((resolve, reject) => {
      NativeNfcManager.start((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    })
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

  registerTagEvent(options = {}) {
    const optionsWithDefault = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    return new Promise((resolve, reject) => {
      NativeNfcManager.registerTagEvent(optionsWithDefault, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  unregisterTagEvent() {
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

  _requestTechnology(tech) {
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

  _cancelTechnologyRequest() {
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

  _getTag() {
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
  // public only for Android
  // -------------------------------------
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
  // public only for iOS
  // -------------------------------------
  setAlertMessageIOS(alertMessage) {
    if (Platform.OS !== 'ios') {
      // it's a no-op for android
      return;
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.setAlertMessage(alertMessage, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      })
    })
  }

  // -------------------------------------
  // Android private
  // -------------------------------------
  _hasTagEventRegistrationAndroid() {
    if (Platform.OS !== 'android') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.hasTagEventRegistration((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  // -------------------------------------
  // iOS private
  // -------------------------------------
  _isSessionAvailableIOS() {
    if (Platform.OS !== 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.isSessionAvailable((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  _isSessionExAvailableIOS() {
    if (Platform.OS !== 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.isSessionExAvailable((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  _registerTagEventExIOS(options = {}) {
    if (Platform.OS !== 'ios') {
      return Promise.reject('not implemented');
    }

    const optionsWithDefault = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    return new Promise((resolve, reject) => {
      NativeNfcManager.registerTagEventEx(optionsWithDefault, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  _unregisterTagEventExIOS() {
    if (Platform.OS !== 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.unregisterTagEventEx((err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result)
        }
      })
    })
  }

  // -------------------------------------
  // deprecated APIs 
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
  requestTechnology = async (tech, options={}) => {
    try {
      if (typeof tech === 'string') {
        tech = [tech];
      }

      let hasNdefTech = tech.indexOf(NfcTech.Ndef) !== -1;
      let sessionAvailable = false;

      // check if required session is available
      if (Platform.OS === 'ios') {
        if (hasNdefTech) {
          sessionAvailable = await this._isSessionAvailableIOS();
        } else {
          sessionAvailable = await this._isSessionExAvailableIOS();
        }
      } else {
        sessionAvailable = await this._hasTagEventRegistrationAndroid();
      }

      // make sure we do register for tag event 
      if (!sessionAvailable) {
        if (Platform.OS === 'ios') {
          if (hasNdefTech) {
            await this.registerTagEvent(options);
          } else {
            await this._registerTagEventExIOS(options);
          }
        } else {
          await this.registerTagEvent(options);
        }

        // the tag registration is 
        this.cleanUpTagRegistration = true;
      }

      return await this._requestTechnology(tech);
    } catch (ex) {
      throw ex;
    }
  }

  cancelTechnologyRequest = async () => {
    await this._cancelTechnologyRequest();

    if (this.cleanUpTagRegistration) {
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
        await this.unregisterTagEvent();
        return;
      }
    }
  }

  getTag = async () => {
    return this._getTag();
  }

  // -------------------------------------
  // NfcTech.Ndef API
  // -------------------------------------
  writeNdefMessage(bytes) {
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

  getCachedNdefMessageAndroid() {
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

  makeReadOnlyAndroid() {
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

  connect(techs) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }
    return new Promise((resolve, reject) => {
      NativeNfcManager.connect(techs, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  close() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }
    return new Promise((resolve, reject) => {
      NativeNfcManager.close((err, result) => {
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

  // -------------------------------------
  // iOS specific 
  // -------------------------------------
  sendMifareCommandIOS(bytes) {
    if (Platform.OS !== 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.sendMifareCommand(bytes, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    })
  }

  sendCommandAPDUIOS(bytes) {
    if (Platform.OS !== 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.sendCommandAPDU(bytes, (err, response, sw1, sw2) => {
        if (err) {
          reject(err);
        } else {
          resolve({response, sw1, sw2});
        }
      });
    })
  }

}

export default new NfcManager();

export {
  ByteParser,
  NdefParser,
  NfcTech,
  NfcEvents,
  NfcAdapter,
  Ndef,
}
