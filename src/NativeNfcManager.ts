'use strict';
import {NativeModules, NativeEventEmitter} from 'react-native';

type NativeMethod = (...args: unknown[]) => void;
type NativeModule = Record<string, NativeMethod> & Record<string, unknown> & {
  addListener: (eventType: string) => void;
  removeListeners: (count: number) => void;
};
type NativeEventSubscription = {remove: () => void};
type NativeEmitterLike = {
  addListener: (eventName: string, listener: (payload: unknown) => void) => NativeEventSubscription;
};

const isTurboModuleEnabled = global?.__turboModuleProxy != null;
const nativeModules = NativeModules || {};
const NativeNfcManager = (isTurboModuleEnabled
  ? require('../specs/NativeNfcManager').default
  : nativeModules.NfcManager) as NativeModule;

const NfcManagerEmitter: NativeEmitterLike =
  typeof NativeEventEmitter === 'function'
    ? new NativeEventEmitter(NativeNfcManager)
    : {addListener: () => ({remove: () => {}})};

function callNative<T = unknown>(name: string, params: unknown[] = []): Promise<T> {
  const nativeMethod = NativeNfcManager[name] as NativeMethod | undefined;

  if (!nativeMethod) {
    throw new Error(`no such native method: "${name}"`);
  }

  if (!Array.isArray(params)) {
    throw new Error('params must be an array');
  }

  const createCallback = (
    resolve: (value: T | PromiseLike<T>) => void,
    reject: (reason?: unknown) => void,
  ) => (err: unknown, result: T) => {
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
