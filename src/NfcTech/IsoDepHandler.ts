import {Platform} from 'react-native';
import {callNative, NativeNfcManager} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

type Byte = number;
type ByteArray = Byte[];

class IsoDepHandler {
  async transceive(bytes: ByteArray): Promise<ByteArray> {
    if (!Array.isArray(bytes)) {
      throw new Error(
        'IsoDepHandler.transceive only takes input as a byte array',
      );
    }

    if (Platform.OS === 'ios') {
      return handleNativeException(
        new Promise<ByteArray>((resolve, reject) => {
          NativeNfcManager.sendCommandAPDUBytes(
            bytes,
            (err: string | null, response: ByteArray, sw1: number, sw2: number) => {
              if (err) {
                reject(err);
              } else {
                // TODO: make following data the same format as Android
                resolve([...response, sw1, sw2]);
              }
            },
          );
        }),
      ) as Promise<ByteArray>;
    }

    return handleNativeException(callNative('transceive', [bytes])) as Promise<ByteArray>;
  }
}

export {IsoDepHandler};
