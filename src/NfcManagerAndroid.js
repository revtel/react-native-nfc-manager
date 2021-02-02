'use strict';
import {Platform} from 'react-native';
import {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
} from './NativeNfcManager';
import {NfcEvents, NfcManagerBase} from './NfcManager';
import {MifareClassicHandlerAndroid} from './NfcTech/MifareClassicHandlerAndroid';
import {MifareUltralightHandlerAndroid} from './NfcTech/MifareUltralightHandlerAndroid';

const NfcAdapter = {
  FLAG_READER_NFC_A: 0x1,
  FLAG_READER_NFC_B: 0x2,
  FLAG_READER_NFC_F: 0x4,
  FLAG_READER_NFC_V: 0x8,
  FLAG_READER_NFC_BARCODE: 0x10,
  FLAG_READER_SKIP_NDEF_CHECK: 0x80,
  FLAG_READER_NO_PLATFORM_SOUNDS: 0x100,
};

class NfcManagerAndroid extends NfcManagerBase {
  constructor() {
    super();
    this.cleanUpTagRegistration = false;
  }

  requestTechnology = async (tech, options = {}) => {
    try {
      if (typeof tech === 'string') {
        tech = [tech];
      }

      const sessionAvailable = await this._hasTagEventRegistrationAndroid();

      // make sure we do register for tag event
      if (!sessionAvailable) {
        await this.registerTagEvent(options);
        this.cleanUpTagRegistration = true;
      }

      return callNative('requestTechnology', [tech]);
    } catch (ex) {
      throw ex;
    }
  };

  cancelTechnologyRequest = async () => {
    await callNative('cancelTechnologyRequest');

    if (!this.cleanUpTagRegistration) {
      await this.unregisterTagEvent();
      this.cleanUpTagRegistration = false;
    }
  };

  // -------------------------------------
  // public only for Android
  // -------------------------------------
  isEnabled = () => callNative('isEnabled');

  goToNfcSetting = () => callNative('goToNfcSetting');

  getLaunchTagEvent = () => callNative('getLaunchTagEvent');

  setNdefPushMessage = (bytes) => callNative('setNdefPushMessage', [bytes]);

  setTimeout = (timeout) => callNative('setTimeout', [timeout]);

  connect = (techs) => callNative('connect', [techs]);

  close = () => callNative('close');

  transceive = (bytes) => callNative('transceive', [bytes]);

  getMaxTransceiveLength = () => callNative('getMaxTransceiveLength');

  // -------------------------------------
  // (android) NfcTech.MifareClassic API
  // -------------------------------------
  get mifareClassicHandlerAndroid() {
    if (!this._mifareClassicHandlerAndroid) {
      this._mifareClassicHandlerAndroid = new MifareClassicHandlerAndroid();
    }
    return this._mifareClassicHandlerAndroid;
  }

  // -------------------------------------
  // (android) NfcTech.MifareUltralight API
  // -------------------------------------
  get mifareUltralightHandlerAndroid() {
    if (!this._mifareUltralightHandlerAndroid) {
      this._mifareUltralightHandlerAndroid = new MifareUltralightHandlerAndroid();
    }
    return this._mifareClassicHandlerAndroid;
  }

  // -------------------------------------
  // Android private
  // -------------------------------------
  _hasTagEventRegistrationAndroid = () => callNative('hasTagEventRegistration');
}

export {NfcAdapter, NfcManagerAndroid};
