'use strict';
import {Platform} from 'react-native';
import {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
} from './NativeNfcManager';
import {NfcEvents, NfcManagerBase} from './NfcManager';

const Nfc15693RequestFlagIOS = {
  DualSubCarriers: 1 << 0,
  HighDataRate: 1 << 1,
  ProtocolExtension: 1 << 3,
  Select: 1 << 4,
  Address: 1 << 5,
  Option: 1 << 6,
};

class Iso15693HandlerIOS {
  getSystemInfo(requestFlag) {
    return callNative('iso15693_getSystemInfo', [requestFlag]);
  }

  readSingleBlock({flags, blockNumber}) {
    return callNative('iso15693_readSingleBlock', [{flags, blockNumber}]);
  }

  readMultipleBlocks({flags, blockNumber, blockCount}) {
    return callNative('iso15693_readMultipleBlocks', [
      {flags, blockNumber, blockCount},
    ]);
  }

  writeSingleBlock({flags, blockNumber, dataBlock}) {
    return callNative('iso15693_writeSingleBlock', [
      {flags, blockNumber, dataBlock},
    ]);
  }

  lockBlock({flags, blockNumber}) {
    return callNative('iso15693_lockBlock', [{flags, blockNumber}]);
  }

  writeAFI({flags, afi}) {
    return callNative('iso15693_writeAFI', [{flags, afi}]);
  }

  lockAFI({flags}) {
    return callNative('iso15693_lockAFI', [{flags}]);
  }

  writeDSFID({flags, dsfid}) {
    return callNative('iso15693_writeDSFID', [{flags, dsfid}]);
  }

  lockDSFID({flags}) {
    return callNative('iso15693_lockDSFID', [{flags}]);
  }

  resetToReady({flags}) {
    return callNative('iso15693_resetToReady', [{flags}]);
  }

  select({flags}) {
    return callNative('iso15693_select', [{flags}]);
  }

  stayQuite() {
    return callNative('iso15693_stayQuiet');
  }

  customCommand({flags, customCommandCode, customRequestParameters}) {
    return callNative('iso15693_customCommand', [
      {flags, customCommandCode, customRequestParameters},
    ]);
  }

  extendedReadSingleBlock({flags, blockNumber}) {
    return callNative('iso15693_extendedReadSingleBlock', [
      {flags, blockNumber},
    ]);
  }

  extendedWriteSingleBlock({flags, blockNumber, dataBlock}) {
    return callNative('iso15693_extendedWriteSingleBlock', [
      {flags, blockNumber, dataBlock},
    ]);
  }

  extendedLockBlock({flags, blockNumber}) {
    return callNative('iso15693_extendedLockBlock', [{flags, blockNumber}]);
  }
}

class NfcManagerIOS extends NfcManagerBase {
  constructor() {
    super();
    this.cleanUpTagRegistration = false;
    this._subscribeNativeEvents();

    if (Platform.OS === 'ios') {
      this._iso15693HandlerIOS = new Iso15693HandlerIOS();
    }
  }

  requestTechnology = async (tech, options = {}) => {
    try {
      if (typeof tech === 'string') {
        tech = [tech];
      }

      let sessionAvailable = false;

      // check if required session is available
      if (Platform.OS === 'ios') {
        sessionAvailable = await this._isSessionExAvailableIOS();
      } else {
        sessionAvailable = await this._hasTagEventRegistrationAndroid();
      }

      // make sure we do register for tag event
      if (!sessionAvailable) {
        if (Platform.OS === 'ios') {
          await this._registerTagEventExIOS(options);
        } else {
          await this.registerTagEvent(options);
        }

        this.cleanUpTagRegistration = true;
      }

      return callNative('requestTechnology', [tech]);
    } catch (ex) {
      throw ex;
    }
  };

  cancelTechnologyRequest = async () => {
    if (!this.cleanUpTagRegistration) {
      await callNative('cancelTechnologyRequest');
      return;
    }

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
      await callNative('cancelTechnologyRequest');
      await this.unregisterTagEvent();
      return;
    }
  };

  // -------------------------------------
  // private
  // -------------------------------------
  _subscribeNativeEvents = () => {
    this._subscriptions = {};
    this._clientListeners = {};
    this._subscriptions[NfcEvents.DiscoverTag] = NfcManagerEmitter.addListener(
      NfcEvents.DiscoverTag,
      this._onDiscoverTag,
    );

    if (Platform.OS === 'ios') {
      this._subscriptions[
        NfcEvents.SessionClosed
      ] = NfcManagerEmitter.addListener(
        NfcEvents.SessionClosed,
        this._onSessionClosedIOS,
      );
    }

    if (Platform.OS === 'android') {
      this._subscriptions[
        NfcEvents.StateChanged
      ] = NfcManagerEmitter.addListener(
        NfcEvents.StateChanged,
        this._onStateChangedAndroid,
      );
    }
  };

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
  // (iOS) NfcTech.Iso15693IOS API
  // -------------------------------------
  getIso15693HandlerIOS = () => this._iso15693HandlerIOS;

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
  // iOS private
  // -------------------------------------
  _isSessionAvailableIOS = () => callNative('isSessionAvailable');

  _isSessionExAvailableIOS = () => callNative('isSessionExAvailable');

  _registerTagEventExIOS = (options = {}) => {
    const optionsWithDefault = {
      ...DEFAULT_REGISTER_TAG_EVENT_OPTIONS,
      ...options,
    };

    return callNative('registerTagEventEx', [optionsWithDefault]);
  };

  _unregisterTagEventExIOS = () => callNative('unregisterTagEventEx');
}

export {NfcManagerIOS, Nfc15693RequestFlagIOS};
