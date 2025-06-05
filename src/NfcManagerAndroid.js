import {callNative} from './NativeNfcManager';
import {NfcManagerBase} from './NfcManager';
import {MifareClassicHandlerAndroid} from './NfcTech/MifareClassicHandlerAndroid';
import {MifareUltralightHandlerAndroid} from './NfcTech/MifareUltralightHandlerAndroid';
import {NdefFormatableHandlerAndroid} from './NfcTech/NdefFormatableHandlerAndroid';
import {handleNativeException, buildNfcExceptionAndroid} from './NfcError';

const NfcAdapter = {
  FLAG_READER_NFC_A: 0x1,
  FLAG_READER_NFC_B: 0x2,
  FLAG_READER_NFC_F: 0x4,
  FLAG_READER_NFC_V: 0x8,
  FLAG_READER_NFC_BARCODE: 0x10,
  FLAG_READER_SKIP_NDEF_CHECK: 0x80,
  FLAG_READER_NO_PLATFORM_SOUNDS: 0x100,
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

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

      return await callNative('requestTechnology', [tech]);
    } catch (ex) {
      throw buildNfcExceptionAndroid(ex);
    }
  };

  cancelTechnologyRequest = async (options = {}) => {
    const {throwOnError = false, delayMsAndroid = 1000} = options;

    try {
      await callNative('cancelTechnologyRequest');

      if (this.cleanUpTagRegistration) {
        await delay(delayMsAndroid);
        await this.unregisterTagEvent();
        this.cleanUpTagRegistration = false;
      }
    } catch (ex) {
      if (throwOnError) {
        throw buildNfcExceptionAndroid(ex);
      }
    }
  };

  getBackgroundTag = () =>
    handleNativeException(callNative('getBackgroundTag'));

  clearBackgroundTag = () =>
    handleNativeException(callNative('clearBackgroundTag'));

  // -------------------------------------
  // public only for Android
  // -------------------------------------
  isEnabled = () => handleNativeException(callNative('isEnabled'));

  goToNfcSetting = () => handleNativeException(callNative('goToNfcSetting'));

  getLaunchTagEvent = () =>
    handleNativeException(callNative('getLaunchTagEvent'));

  setNdefPushMessage = (bytes) => {
    return Promise.reject('this api is deprecated');
  }

  setTimeout = (timeout) =>
    handleNativeException(callNative('setTimeout', [timeout]));

  connect = (techs) => handleNativeException(callNative('connect', [techs]));

  close = () => handleNativeException(callNative('close'));

  transceive = (bytes) =>
    handleNativeException(callNative('transceive', [bytes]));

  getMaxTransceiveLength = () =>
    handleNativeException(callNative('getMaxTransceiveLength'));

  // -------------------------------------
  // HCE (Host Card Emulation) API
  // -------------------------------------
  isHceSupported = () =>
    handleNativeException(callNative('isHceSupported'));

  startHCE = async () => {
    try {
      // First check if HCE is supported
      const isSupported = await this.isHceSupported();
      if (!isSupported) {
        throw new Error('HCE is not supported on this device');
      }

      // Then start the HCE service
      const result = await handleNativeException(callNative('startHCE'));
      return result;
    } catch (error) {
      console.error('Error starting HCE:', error);
      throw error;
    }
  };

  stopHCE = async () => {
    try {
      const result = await handleNativeException(callNative('stopHCE'));
      return result;
    } catch (error) {
      console.error('Error stopping HCE:', error);
      throw error;
    }
  };

  setSimpleUrl = (url) =>
    handleNativeException(callNative('setSimpleUrl', [url]));

  // ios is not able to read the vcard direclty without using an app
  setVCard = (vcard) =>
    handleNativeException(callNative('setVCard', [vcard]));

  clearContent = () =>
    handleNativeException(callNative('clearContent'));

  // -------------------------------------
  // (android) NfcTech.MifareClassic API
  // -------------------------------------
  get mifareClassicHandlerAndroid() {
    if (!this._mifareClassicHandlerAndroid) {
      this._mifareClassicHandlerAndroid = new MifareClassicHandlerAndroid(this);
    }
    return this._mifareClassicHandlerAndroid;
  }

  // -------------------------------------
  // (android) NfcTech.MifareUltralight API
  // -------------------------------------
  get mifareUltralightHandlerAndroid() {
    if (!this._mifareUltralightHandlerAndroid) {
      this._mifareUltralightHandlerAndroid = new MifareUltralightHandlerAndroid(
        this,
      );
    }
    return this._mifareUltralightHandlerAndroid;
  }

  // -------------------------------------
  // (android) NfcTech.NdefFormatable API
  // -------------------------------------
  get ndefFormatableHandlerAndroid() {
    if (!this._ndefFormatableHandlerAndroid) {
      this._ndefFormatableHandlerAndroid = new NdefFormatableHandlerAndroid(this);
    }
    return this._ndefFormatableHandlerAndroid;
  }

  // -------------------------------------
  // Android private
  // -------------------------------------
  _hasTagEventRegistrationAndroid = () =>
    handleNativeException(callNative('hasTagEventRegistration'));

  setVCard = (vcfString) =>
    handleNativeException(callNative('setVCard', [vcfString]));
}

export {NfcAdapter, NfcManagerAndroid};
