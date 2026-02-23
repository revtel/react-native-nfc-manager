import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

type Byte = number;
type ByteArray = Byte[];

type AndroidMifareUltralightManager = {
  MIFARE_ULTRALIGHT_PAGE_SIZE: number;
};

class MifareUltralightHandlerAndroid {
  nfcManager: AndroidMifareUltralightManager;

  constructor(nfcManager: AndroidMifareUltralightManager) {
    this.nfcManager = nfcManager;
  }

  async mifareUltralightReadPages(pageOffset: number): Promise<ByteArray> {
    return handleNativeException(
      callNative('mifareUltralightReadPages', [pageOffset]),
    ) as Promise<ByteArray>;
  }

  async mifareUltralightWritePage(pageOffset: number, data: ByteArray): Promise<void> {
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
    ) as Promise<void>;
  }
}

export {MifareUltralightHandlerAndroid};
