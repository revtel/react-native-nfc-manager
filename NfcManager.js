'use strict';
import {
  NativeModules,
  NativeEventEmitter,
  Platform
} from 'react-native'

const NativeNfcManager = NativeModules.NfcManager;
const NfcManagerEmitter = new NativeEventEmitter(NativeNfcManager);

const Events = {
  DiscoverTag: 'NfcManagerDiscoverTag'
}

const LOG = 'NfcManagerJs';

class NfcManager {
  constructor() {
    this._clientTagDiscoveryListener = null;
    this._subscription = null;
  }

  start() {
    return new Promise((resolve, reject) => {
      NativeNfcManager.start(resolve);
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
}

export default new NfcManager();
