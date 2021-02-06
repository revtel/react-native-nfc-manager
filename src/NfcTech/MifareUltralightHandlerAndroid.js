import {callNative} from '../NativeNfcManager';

class MifareUltralightHandlerAndroid {
  async mifareUltralightReadPages(pageOffset) {
    return callNative('mifareUltralightReadPages', [pageOffset]);
  }

  async mifareUltralightWritePage(pageOffset, data) {
    if (
      !data ||
      !Array.isArray(data) ||
      data.length !== this.MIFARE_ULTRALIGHT_PAGE_SIZE
    ) {
      throw new Error(
        `data should be a non-empty Array[${this.MIFARE_ULTRALIGHT_PAGE_SIZE}] of integers (0 - 255)`,
      );
    }

    return callNative('mifareUltralightWritePage', [pageOffset, data]);
  }
}

export {MifareUltralightHandlerAndroid};
