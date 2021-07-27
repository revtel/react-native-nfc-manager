'use strict';
import {NativeModules, NativeEventEmitter} from 'react-native';

const NativeNfcManager = NativeModules.NfcManager;
const NfcManagerEmitter = new NativeEventEmitter(NativeNfcManager);

function callNative(name, params = []) {
  const nativeMethod = NativeNfcManager[name];

  if (!nativeMethod) {
    throw new Error(`no such native method: "${name}"`);
  }

  if (!Array.isArray(params)) {
    throw new Error('params must be an array');
  }

  const createCallback = (resolve, reject) => (err, result) => {
    if (err) {
      reject(err);
    } else {
      resolve(result);
    }
  };

  return new Promise((resolve, reject) => {
    const callback = createCallback(resolve, reject);
    const inputParams = [...params, callback];
    nativeMethod(...inputParams);
  });
}

export {NativeNfcManager, NfcManagerEmitter, callNative};
