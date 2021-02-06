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
  Iso15693HandlerIOS,
} from './NfcTech/Iso15693HandlerIOS';

class NfcManagerIOS extends NfcManagerBase {
  constructor() {
    super();
  }

  requestTechnology = async (tech, options = {}) => {
    try {
      if (typeof tech === 'string') {
        tech = [tech];
      }

      const techList = [];
      for (const t of tech) {
        if (t === NfcTech.NfcA) {
          techList.push(NfcTech.MifareIOS);
        } else {
          techList.push(t);
        }
      }

      return callNative('requestTechnology', [
        techList,
        {
          ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
          ...options,
        },
      ]);
    } catch (ex) {
      throw ex;
    }
  };

  cancelTechnologyRequest = async () => callNative('cancelTechnologyRequest');

  // -------------------------------------
  // public only for iOS
  // -------------------------------------
  setAlertMessageIOS = (alertMessage) => {
    if (Platform.OS !== 'ios') {
      return Promise.resolve(); //no-op
    }
    callNative('setAlertMessage', [alertMessage]);
  };

  invalidateSessionIOS = () => callNative('invalidateSession');

  invalidateSessionWithErrorIOS = (errorMessage = 'Error') =>
    callNative('invalidateSessionWithError', [errorMessage]);

  // -------------------------------------
  // (iOS) NfcTech.MifareIOS API
  // -------------------------------------
  sendMifareCommandIOS = (bytes) => callNative('sendMifareCommand', [bytes]);

  // -------------------------------------
  // (iOS) NfcTech.FelicaIOS API
  // -------------------------------------
  sendFelicaCommandIOS = (bytes) => callNative('sendFelicaCommand', [bytes]);

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
      });
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
      });
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

export {NfcManagerIOS, Nfc15693RequestFlagIOS};
