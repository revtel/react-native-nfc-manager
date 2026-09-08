'use strict';
import {NativeModules, NativeEventEmitter} from 'react-native';

type NativeMethod = (...args: unknown[]) => void;
type NativeEventSubscription = {remove: () => void};
type CodegenEventEmitter = (
  listener: (payload: unknown) => void,
) => NativeEventSubscription;
type NativeModule = Record<string, NativeMethod> & Record<string, unknown> & {
  addListener: (eventType: string) => void;
  removeListeners: (count: number) => void;
  onDiscoverTag?: CodegenEventEmitter;
  onDiscoverBackgroundTag?: CodegenEventEmitter;
  onSessionClosed?: CodegenEventEmitter;
  onStateChanged?: CodegenEventEmitter;
};
type NativeEmitterLike = {
  addListener: (eventName: string, listener: (payload: unknown) => void) => NativeEventSubscription;
};

const reactNativeGlobal = global as typeof global & {
  'RN$Bridgeless'?: boolean;
  __turboModuleProxy?: unknown;
};
const isTurboModuleEnabled =
  reactNativeGlobal['RN$Bridgeless'] === true ||
  reactNativeGlobal.__turboModuleProxy != null;
const nativeModules = NativeModules || {};
const NativeNfcManager = (isTurboModuleEnabled
  ? require('../specs/NativeNfcManager').default
  : nativeModules.NfcManager) as NativeModule;

const legacyNfcManagerEmitter: NativeEmitterLike =
  typeof NativeEventEmitter === 'function'
    ? new NativeEventEmitter(NativeNfcManager)
    : {addListener: () => ({remove: () => {}})};

const codegenEventEmitters: Record<string, CodegenEventEmitter | undefined> = {
  NfcManagerDiscoverTag: NativeNfcManager.onDiscoverTag,
  NfcManagerDiscoverBackgroundTag: NativeNfcManager.onDiscoverBackgroundTag,
  NfcManagerSessionClosed: NativeNfcManager.onSessionClosed,
  NfcManagerStateChanged: NativeNfcManager.onStateChanged,
};

const NfcManagerEmitter: NativeEmitterLike = {
  addListener: (eventName, listener) => {
    const codegenEmitter = codegenEventEmitters[eventName];
    if (isTurboModuleEnabled && codegenEmitter) {
      return codegenEmitter(listener);
    }
    return legacyNfcManagerEmitter.addListener(eventName, listener);
  },
};

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
