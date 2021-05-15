let _nextError = null;
let _nextErrorMethod = null;

const NativeNfcManager = {
  MIFARE_BLOCK_SIZE: 16,
  MIFARE_ULTRALIGHT_PAGE_SIZE: 4,
  setNextError: (err, nativeMethodName = null) => {
    _nextError = err;
    _nextErrorMethod = nativeMethodName;
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
  // eslint-disable-next-line no-unused-vars
  const [methodName, ...rest] = args;
  if (_nextError && (!methodName || methodName === _nextErrorMethod)) {
    const err = _nextError;
    _nextError = null;
    _nextErrorMethod = null;
    return Promise.reject(err);
  }
});

export {NativeNfcManager, NfcManagerEmitter, callNative};
