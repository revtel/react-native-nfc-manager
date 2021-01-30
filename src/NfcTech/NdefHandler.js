import {Platform} from 'react-native';
import {callNative} from '../NativeNfcManager';

const NDEFStatusIOS = {
  NotSupported: 1,
  ReadWrite: 2,
  ReadOnly: 3,
};

class NdefHandler {
  writeNdefMessage(bytes) {
    return callNative('writeNdefMessage', [bytes]);
  }

  getNdefMessage() {
    return callNative('getNdefMessage');
  }

  makeReadOnly() {
    return callNative('makeReadOnly');
  }

  getExtraInfo() {
    if (Platform.OS === 'ios') {
      return callNative('queryNDEFStatus');
    } else {
      // TODO: impl for android
      return {};
    }
  }
}

export {NdefHandler, NDEFStatusIOS};
