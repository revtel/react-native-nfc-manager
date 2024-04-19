import {Platform} from 'react-native';
import {callNative, NativeNfcManager} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

class NfcVHandler {
  async transceive(bytes) {
    if (!Array.isArray(bytes)) {
      throw new Error(
        'IsoDepHandler.transceive only takes input as a byte array',
      );
    }

    if (Platform.OS === 'ios') {
      const [flags, commandCode, ...data] = bytes;
      return handleNativeException(
        new Promise((resolve, reject) => {
          NativeNfcManager.iso15693_sendRequest(
            {
                flags,
                commandCode,
                data,
            },
            (err, responseFlag, response) => {
              if (err) {
                reject(err);
              } else {
                resolve([responseFlag, ...response]);
              }
            },
          );
        }),
      );
    }

    return handleNativeException(callNative('transceive', [bytes]));
  }
}

export {NfcVHandler};
