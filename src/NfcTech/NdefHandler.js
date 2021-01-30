import {Platform} from 'react-native';
import {callNative} from '../NativeNfcManager';

const NdefStatus = {
  NotSupported: 1,
  ReadWrite: 2,
  ReadOnly: 3,
};

class NdefHandler {
  async writeNdefMessage(bytes) {
    return callNative('writeNdefMessage', [bytes]);
  }

  async getNdefMessage() {
    return callNative('getNdefMessage');
  }

  async makeReadOnly() {
    return callNative('makeReadOnly');
  }

  async getNdefStatus() {
    if (Platform.OS === 'ios') {
      return callNative('queryNDEFStatus');
    } else {
      try {
        const result = await callNative('getNdefStatus');
        return {
          status: result.isWritable
            ? NdefStatus.ReadWrite
            : NdefStatus.ReadOnly,
          capacity: result.maxSize,
        };
      } catch (ex) {
        return {
          status: NdefStatus.NotSupported,
          capacity: 0,
        };
      }
    }
  }
}

export {NdefHandler, NdefStatus};
