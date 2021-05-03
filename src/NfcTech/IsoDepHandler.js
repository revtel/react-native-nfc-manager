import {Platform} from 'react-native';
import {callNative, NativeNfcManager} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

class IsoDepHandler {
  async transceive(bytes) {
    if (!Array.isArray(bytes)) {
      throw new Error(
        'IsoDepHandler.transceive only takes input as a byte array',
      );
    }

    if (Platform.OS === 'ios') {
      return handleNativeException(
        new Promise((resolve, reject) => {
          NativeNfcManager.sendCommandAPDUBytes(
            bytes,
            (err, response, sw1, sw2) => {
              if (err) {
                reject(err);
              } else {
                // TODO: make following data the same format as Android
                resolve([...response, sw1, sw2]);
              }
            },
          );
        }),
      );
    }

    return handleNativeException(callNative('transceive', [bytes]));
  }
}

export {IsoDepHandler};
