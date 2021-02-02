import {Platform} from 'react-native';
import {callNative} from '../NativeNfcManager';

class NfcAHandler {
  async transceive(bytes) {
    if (Platform.OS === 'ios') {
      return callNative('sendMifareCommand', [bytes]);
    }
    return callNative('transceive', [bytes]);
  }
}

export {NfcAHandler};
