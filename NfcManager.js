'use strict';
import {
  NativeModules,
  NativeEventEmitter,
  Platform
} from 'react-native'
import NdefParser from './NdefParser'

const NativeNfcManager = NativeModules.NfcManager;
const NfcManagerEmitter = new NativeEventEmitter(NativeNfcManager);

const Events = {
  DiscoverTag: 'NfcManagerDiscoverTag',
  SessionClosed: 'NfcManagerSessionClosed',
}

const LOG = 'NfcManagerJs';

class NfcManager {
  constructor() {
    this._clientTagDiscoveryListener = null;
    this._clientSessionClosedListener = null;
    this._subscription = null;
  }

  requestNdefWrite(bytes, {format=false, formatReadOnly=false}={}) {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise(resolve => {
      NativeNfcManager.requestNdefWrite(bytes, {format, formatReadOnly}, resolve)
    })
      .then((err, result) => {
        if (err) {
          return Promise.reject(err);
        }
        return Promise.resolve(result);
      })
  }

  cancelNdefWrite() {
    if (Platform.OS === 'ios') {
      return Promise.reject('not implemented');
    }

    return new Promise(resolve => {
      NativeNfcManager.cancelNdefWrite(resolve)
    })
      .then((err, result) => {
        if (err) {
          return Promise.reject(err);
        }
        return Promise.resolve(result);
      })
  }

  start({ onSessionClosedIOS } = {}) {
    return new Promise(resolve => {
      NativeNfcManager.start(resolve);
    })
      .then((err, result) => {
        if (err) {
          console.log('NfcManager: nfc not supported');
          return Promise.reject(err);
        }

        if (Platform.OS === 'ios') {
          this._clientSessionClosedListener = onSessionClosedIOS;
          this._session = NfcManagerEmitter.addListener(Events.SessionClosed, this._handleSessionClosed);
        } else {
          this._session = {
            remove: () => {},
          };
        }
      })
  }

  stop() {
    this._session.remove();
    this._session = null;
  }

  isSupported(){
    return new Promise(resolve => {
      NativeNfcManager.isSupported((err,result) => {
        resolve(result);
      })
    })
  }

  isEnabled() {
    return new Promise(resolve => {
      NativeNfcManager.isEnabled((err, result) => {
        resolve(result)
      })
    })
  }

  goToNfcSetting() {
    return new Promise(resolve => {
      NativeNfcManager.goToNfcSetting(resolve)
    })
  }

  getLaunchTagEvent() {
    return new Promise(resolve => {
      NativeNfcManager.getLaunchTagEvent((err, tag) => resolve(tag));
    })
  }

  registerTagEvent(listener, alertMessage = '', invalidateAfterFirstRead = false) {
    if (!this._subscription) {
      return new Promise(resolve => {
        NativeNfcManager.registerTagEvent(alertMessage, invalidateAfterFirstRead, () => {
          this._clientTagDiscoveryListener = listener;
          this._subscription = NfcManagerEmitter.addListener(Events.DiscoverTag, this._handleDiscoverTag);
          resolve();
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
      return new Promise(resolve => {
        NativeNfcManager.unregisterTagEvent(() => {
          resolve();
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
    this._clientTagDiscoveryListener = null;
    this._clientSessionClosedListener && this._clientSessionClosedListener();
  }
}

export default new NfcManager();

export {
  NdefParser
}
