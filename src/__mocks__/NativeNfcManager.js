const NativeNfcManager = {};

const NfcManagerEmitterListener = {};
const NfcManagerEmitter = {
  addListener: jest.fn((name, callback) => {
    NfcManagerEmitterListener[name] = callback;
  }),

  _testTriggerCallback: (name, data) => {
    NfcManagerEmitterListener[name](data);
  },
};

const callNative = jest.fn();

export {NativeNfcManager, NfcManagerEmitter, callNative};
