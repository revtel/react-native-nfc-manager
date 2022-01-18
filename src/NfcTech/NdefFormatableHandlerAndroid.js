import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

class NdefFormatableHandlerAndroid {
  async formatNdef(bytes, options={}) {
    const defaultOptions = { readOnly: false };
    return handleNativeException(
        callNative('formatNdef', [
            bytes, 
            {...defaultOptions, ...options}
        ])
    );
  }
}

export {NdefFormatableHandlerAndroid};
