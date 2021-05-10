import {Platform} from 'react-native';
import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

class NfcAHandler {
  async transceive(bytes) {
    if (Platform.OS === 'ios') {
      return handleNativeException(callNative('sendMifareCommand', [bytes]));
    }
    return handleNativeException(callNative('transceive', [bytes]));
  }
}

export {NfcAHandler};
