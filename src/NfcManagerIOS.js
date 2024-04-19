'use strict';
import {Platform} from 'react-native';
import {NativeNfcManager, callNative} from './NativeNfcManager';
import {
  NfcTech,
  NfcManagerBase,
  DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
} from './NfcManager';
import {
  Nfc15693RequestFlagIOS,
  Nfc15693ResponseFlagIOS,
  Iso15693HandlerIOS,
} from './NfcTech/Iso15693HandlerIOS';
import {handleNativeException} from './NfcError';

class NfcManagerIOS extends NfcManagerBase {
  constructor() {
    super();
  }

  isEnabled = async () => {
    return true;
  };

  requestTechnology = async (tech, options = {}) => {
    if (typeof tech === 'string') {
      tech = [tech];
    }

    const techList = [];
    for (const t of tech) {
      if (t === NfcTech.NfcA) {
        techList.push(NfcTech.MifareIOS);
      } else if (t === NfcTech.NfcV) {
        techList.push(NfcTech.Iso15693IOS);
      } else {
        techList.push(t);
      }
    }

    return handleNativeException(
      callNative('requestTechnology', [
        techList,
        {
          ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
          ...options,
        },
      ]),
    );
  };

  restartTechnologyRequestIOS = async () => {
    return handleNativeException(
        callNative('restartTechnologyRequest'),
    );
  };

  cancelTechnologyRequest = async (options = {}) => {
    const {throwOnError = false} = options;
    return handleNativeException(
      callNative('cancelTechnologyRequest'),
      !throwOnError,
    );
  };

  getBackgroundTag = async () => {
    // iOS doesn't report the full tag, only the ndefMessage part
    const ndefMessage = await handleNativeException(callNative('getBackgroundNdef'));
    return ndefMessage ? { ndefMessage } : null;
  };

  clearBackgroundTag = async () => callNative('clearBackgroundNdef');

  // -------------------------------------
  // public only for iOS
  // -------------------------------------
  getBackgroundNdef = () =>
    handleNativeException(callNative('getBackgroundNdef'));

  setAlertMessage = (alertMessage) =>
    handleNativeException(callNative('setAlertMessage', [alertMessage]));

  setAlertMessageIOS = (alertMessage) =>
    handleNativeException(callNative('setAlertMessage', [alertMessage]));

  invalidateSessionIOS = () =>
    handleNativeException(callNative('invalidateSession'));

  invalidateSessionWithErrorIOS = (errorMessage = 'Error') =>
    handleNativeException(
      callNative('invalidateSessionWithError', [errorMessage]),
    );

  // -------------------------------------
  // (iOS) NfcTech.MifareIOS API
  // -------------------------------------
  sendMifareCommandIOS = (bytes) =>
    handleNativeException(callNative('sendMifareCommand', [bytes]));

  // -------------------------------------
  // (iOS) NfcTech.FelicaIOS API
  // -------------------------------------
  sendFelicaCommandIOS = (bytes) =>
    handleNativeException(callNative('sendFelicaCommand', [bytes]));

  // -------------------------------------
  // (iOS) NfcTech.IsoDep API
  // -------------------------------------
  sendCommandAPDUIOS = (bytesOrApdu) => {
    if (Platform.OS !== 'ios') {
      return Promise.reject('not implemented');
    }

    if (Array.isArray(bytesOrApdu)) {
      const bytes = bytesOrApdu;
      return handleNativeException(
        new Promise((resolve, reject) => {
          NativeNfcManager.sendCommandAPDUBytes(
            bytes,
            (err, response, sw1, sw2) => {
              if (err) {
                reject(err);
              } else {
                resolve({response, sw1, sw2});
              }
            },
          );
        }),
      );
    } else {
      const apdu = bytesOrApdu;
      return handleNativeException(
        new Promise((resolve, reject) => {
          NativeNfcManager.sendCommandAPDU(apdu, (err, response, sw1, sw2) => {
            if (err) {
              reject(err);
            } else {
              resolve({response, sw1, sw2});
            }
          });
        }),
      );
    }
  };

  // -------------------------------------
  // (iOS) NfcTech.Iso15693IOS API
  // -------------------------------------
  get iso15693HandlerIOS() {
    if (!this._iso15693HandlerIOS) {
      this._iso15693HandlerIOS = new Iso15693HandlerIOS();
    }
    return this._iso15693HandlerIOS;
  }
}

export {NfcManagerIOS, Nfc15693RequestFlagIOS, Nfc15693ResponseFlagIOS};
