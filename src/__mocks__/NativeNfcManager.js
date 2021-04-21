let _nextError = null;

const NativeNfcManager = {
  MIFARE_BLOCK_SIZE: 16,
  MIFARE_ULTRALIGHT_PAGE_SIZE: 4,
  setNextError: (err) => {
    _nextError = err;
  },
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

const callNative = jest.fn((...args) => {
  if (_nextError) {
    const err = _nextError;
    _nextError = null;
    return Promise.reject(err);
  }
});

export {NativeNfcManager, NfcManagerEmitter, callNative};
