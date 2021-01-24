const NativeNfcManager =  {

}

const NfcManagerEmitter = {
  addListener: jest.fn(),
}

const callNative = jest.fn();

export {
  NativeNfcManager,
  NfcManagerEmitter,
  callNative,
}
