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

type RegisterTagEventOptions = Partial<typeof DEFAULT_REGISTER_TAG_EVENT_OPTIONS>;
type CancelTechnologyRequestOptions = {throwOnError?: boolean};
type IsoDepApdu = {
  cla: number;
  ins: number;
  p1: number;
  p2: number;
  data: number[];
  le: number;
};

class NfcManagerIOS extends NfcManagerBase {
  _iso15693HandlerIOS: Iso15693HandlerIOS | null;

  constructor() {
    super();
    this._iso15693HandlerIOS = null;
  }

  isEnabled = async () => {
    return true;
  };

  requestTechnology = async (
    tech: string | string[],
    options: RegisterTagEventOptions = {},
  ) => {
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

  cancelTechnologyRequest = async (options: CancelTechnologyRequestOptions = {}) => {
    const {throwOnError = false} = options;
    return handleNativeException(
      callNative('cancelTechnologyRequest'),
      !throwOnError,
    );
  };

  getBackgroundTag = () =>
    handleNativeException(callNative('getBackgroundTag'));

  clearBackgroundTag = async () => callNative('clearBackgroundTag');

  // -------------------------------------
  // public only for iOS
  // -------------------------------------
  getBackgroundNdef = () =>
    handleNativeException(callNative('getBackgroundNdef'));

  setAlertMessage = (alertMessage: string) =>
    handleNativeException(callNative('setAlertMessage', [alertMessage]));

  setAlertMessageIOS = (alertMessage: string) =>
    handleNativeException(callNative('setAlertMessage', [alertMessage]));

  invalidateSessionIOS = () =>
    handleNativeException(callNative('invalidateSession'));

  invalidateSessionWithErrorIOS = (errorMessage = 'Error') =>
    handleNativeException(
      callNative('invalidateSessionWithError', [errorMessage]),
    );

  isSessionAvailableIOS = async () => 
    handleNativeException(callNative('isSessionAvailable'));
  
  isTagSessionAvailableIOS = async () =>
    handleNativeException(callNative('isTagSessionAvailable'));

  // -------------------------------------
  // (iOS) NfcTech.MifareIOS API
  // -------------------------------------
  sendMifareCommandIOS = (bytes: number[]) =>
    handleNativeException(callNative('sendMifareCommand', [bytes]));

  // -------------------------------------
  // (iOS) NfcTech.FelicaIOS API
  // -------------------------------------
  sendFelicaCommandIOS = (bytes: number[]) =>
    handleNativeException(callNative('sendFelicaCommand', [bytes]));

  // -------------------------------------
  // (iOS) NfcTech.IsoDep API
  // -------------------------------------
  sendCommandAPDUIOS = (bytesOrApdu: number[] | IsoDepApdu) => {
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
