import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

class MifareUltralightHandlerAndroid {
  constructor(nfcManager) {
    this.nfcManager = nfcManager;
  }

  async mifareUltralightReadPages(pageOffset) {
    return handleNativeException(
      callNative('mifareUltralightReadPages', [pageOffset]),
    );
  }

  async mifareUltralightWritePage(pageOffset, data) {
    if (
      !data ||
      !Array.isArray(data) ||
      data.length !== this.nfcManager.MIFARE_ULTRALIGHT_PAGE_SIZE
    ) {
      throw new Error(
        `data should be a non-empty Array[${this.nfcManager.MIFARE_ULTRALIGHT_PAGE_SIZE}] of integers (0 - 255)`,
      );
    }

    return handleNativeException(
      callNative('mifareUltralightWritePage', [pageOffset, data]),
    );
  }
}

export {MifareUltralightHandlerAndroid};
