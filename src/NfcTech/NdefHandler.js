import {callNative} from '../NativeNfcManager';

class NdefHandler {
  writeNdefMessage(bytes) {
    return callNative('writeNdefMessage', [bytes]);
  }

  getNdefMessage() {
    return callNative('getNdefMessage');
  }
}

export {NdefHandler};
