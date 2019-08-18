'use strict';
import {
  NativeModules,
  NativeEventEmitter,
} from 'react-native'

const NativeNfcManager = NativeModules.NfcManager;
const NfcManagerEmitter = new NativeEventEmitter(NativeNfcManager);

export {
  NativeNfcManager,
  NfcManagerEmitter,
}