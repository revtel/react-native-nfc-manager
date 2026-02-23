import {Platform} from 'react-native';
import {callNative, NativeNfcManager} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

type Byte = number;
type ByteArray = Byte[];

class NfcVHandler {
  async transceive(bytes: ByteArray): Promise<ByteArray> {
    if (!Array.isArray(bytes)) {
      throw new Error(
        'IsoDepHandler.transceive only takes input as a byte array',
      );
    }

    if (Platform.OS === 'ios') {
      const [flags, commandCode, ...data] = bytes;
      return handleNativeException(
        new Promise<ByteArray>((resolve, reject) => {
          NativeNfcManager.iso15693_sendRequest(
            {
                flags,
                commandCode,
                data,
            },
            (err: string | null, responseFlag: number, response: ByteArray) => {
              if (err) {
                reject(err);
              } else {
                resolve([responseFlag, ...response]);
              }
            },
          );
        }),
      ) as Promise<ByteArray>;
    }

    return handleNativeException(callNative('transceive', [bytes])) as Promise<ByteArray>;
  }
}

export {NfcVHandler};
