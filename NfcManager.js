'use strict';
import {
  NativeModules,
  NativeEventEmitter,
  Platform
} from 'react-native'
import NdefParser from './NdefParser'
import Ndef from './ndef-lib'

const NativeNfcManager = NativeModules.NfcManager;
const NfcManagerEmitter = new NativeEventEmitter(NativeNfcManager);

const Events = {
  DiscoverTag: 'NfcManagerDiscoverTag',
  SessionClosed: 'NfcManagerSessionClosed',
  StateChanged: 'NfcManagerStateChanged',
}

const NfcTech = {
  Ndef: 'Ndef',
  NfcA: 'NfcA',
  MifareClassic: 'MifareClassic',
}

const LOG = 'NfcManagerJs';

class NfcManager {
  constructor() {
    this._clientTagDiscoveryListener = null;
    this._clientSessionClosedListener = null;
    this._subscription = null;
  }

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
    this._session.remove();
    this._session = null;
    return Promise.resolve();
  }

  isSupported(){
    return new Promise((resolve, reject) => {
      NativeNfcManager.isSupported((err,result) => {
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

  registerTagEvent(listener, alertMessage = '', invalidateAfterFirstRead = false) {
    if (!this._subscription) {
      return new Promise((resolve, reject) => {
        NativeNfcManager.registerTagEvent(alertMessage, invalidateAfterFirstRead, (err, result) => {
          if (err) {
            reject(err);
          } else {
            this._clientTagDiscoveryListener = listener;
            this._subscription = NfcManagerEmitter.addListener(Events.DiscoverTag, this._handleDiscoverTag);
            resolve(result);
          }
        })
      })
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
  mifareClassicAuthenticateA(sector, key, callback) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
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

  mifareClassicAuthenticateB(sector, key, callback) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
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

  getMifareClassicMessage(sector, callback) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise((resolve, reject) => {
      NativeNfcManager.getMifareClassicMessage(sector, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      })
    })
  }

  // -------------------------------------
  // NfcTech.NfcA API
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
}

export default new NfcManager();

export {
  NdefParser,
  NfcTech,
  Ndef,
}
