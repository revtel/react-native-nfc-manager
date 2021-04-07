const NativeNfcManager = {
  MIFARE_BLOCK_SIZE: 16,
  MIFARE_ULTRALIGHT_PAGE_SIZE: 4,
};

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
