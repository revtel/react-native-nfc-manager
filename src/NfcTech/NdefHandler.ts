import {Platform} from 'react-native';
import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

type Byte = number;
type ByteArray = Byte[];

type WriteNdefOptions = {
  reconnectAfterWrite?: boolean;
};

type NdefStatusResult = {
  status: number;
  capacity: number;
};

const NdefStatus = {
  NotSupported: 1,
  ReadWrite: 2,
  ReadOnly: 3,
};

class NdefHandler {
  async writeNdefMessage(bytes: ByteArray, options?: WriteNdefOptions) {
    const defaultOptions = { reconnectAfterWrite: false };
    return handleNativeException(
        callNative('writeNdefMessage', [
            bytes, 
            {...defaultOptions, ...options}
        ])
    );
  }

  async getNdefMessage() {
    return handleNativeException(callNative('getNdefMessage'));
  }

  async makeReadOnly() {
    return handleNativeException(callNative('makeReadOnly'));
  }

  async getNdefStatus(): Promise<NdefStatusResult> {
    if (Platform.OS === 'ios') {
      return handleNativeException(callNative('queryNdefStatus')) as Promise<NdefStatusResult>;
    } else {
      try {
        const result = await handleNativeException(callNative('queryNdefStatus')) as {
          isWritable: boolean;
          maxSize: number;
        };
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

  async getCachedNdefMessageAndroid() {
    return handleNativeException(callNative('getCachedNdefMessage'));
  }
}

export {NdefHandler, NdefStatus};
