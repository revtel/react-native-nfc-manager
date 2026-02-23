import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

type Byte = number;
type ByteArray = Byte[];

type NdefFormatOptions = {
  readOnly?: boolean;
};

class NdefFormatableHandlerAndroid {
  async formatNdef(bytes: ByteArray, options: NdefFormatOptions = {}): Promise<void> {
    const defaultOptions = { readOnly: false };
    return handleNativeException(
        callNative('formatNdef', [
            bytes, 
            {...defaultOptions, ...options}
        ])
    ) as Promise<void>;
  }
}

export {NdefFormatableHandlerAndroid};
