import {Platform} from 'react-native';
import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

type Byte = number;
type ByteArray = Byte[];

class NfcAHandler {
  async transceive(bytes: ByteArray): Promise<ByteArray> {
    if (Platform.OS === 'ios') {
      return handleNativeException(callNative('sendMifareCommand', [bytes])) as Promise<ByteArray>;
    }
    return handleNativeException(callNative('transceive', [bytes])) as Promise<ByteArray>;
  }
}

export {NfcAHandler};
