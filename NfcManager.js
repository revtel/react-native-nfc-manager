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

  start({onSessionClosedIOS}={}) {
    return new Promise((resolve, reject) => {
      NativeNfcManager.start(resolve);
    })
      .then(() => {
        if (Platform.OS === 'ios') {
          this._clientSessionClosedListener = onSessionClosedIOS;
          NfcManagerEmitter.addListener(Events.SessionClosed, this._handleSessionClosed)
        }
      })
  }

  isEnabled() {
    return new Promise((resolve, reject) => {
      NativeNfcManager.isEnabled((err, result) => {
        resolve(result)
      })
    })
  }

  goToNfcSetting() {
    return new Promise((resolve, reject) => {
      NativeNfcManager.goToNfcSetting(resolve)
    })
  }

  getLaunchTagEvent() {
    return new Promise((resolve, reject) => {
      NativeNfcManager.getLaunchTagEvent((err, tag) => resolve(tag));
    })
  }

  registerTagEvent(listener) {
    if (!this._subscription) {
      return new Promise((resolve, reject) => {
        NativeNfcManager.registerTagEvent(() => {
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
      return new Promise((resolve, reject) => {
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
