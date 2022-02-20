import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

class MifareClassicHandlerAndroid {
  constructor(nfcManager) {
    this.nfcManager = nfcManager;
  }

  async mifareClassicAuthenticateA(sector, key) {
    if (!key || !Array.isArray(key) || key.length !== 6) {
      throw new Error('key should be an Array[6] of integers (0 - 255)');
    }

    return handleNativeException(
      callNative('mifareClassicAuthenticateA', [sector, key]),
    );
  }

  async mifareClassicAuthenticateB(sector, key) {
    if (!key || !Array.isArray(key) || key.length !== 6) {
      throw new Error('key should be an Array[6] of integers (0 - 255)');
    }

    return handleNativeException(
      callNative('mifareClassicAuthenticateB', [sector, key]),
    );
  }

  async mifareClassicGetBlockCountInSector(sector) {
    return handleNativeException(
      callNative('mifareClassicGetBlockCountInSector', [sector]),
    );
  }

  async mifareClassicGetSectorCount() {
    return handleNativeException(callNative('mifareClassicGetSectorCount'));
  }

  async mifareClassicSectorToBlock(sector) {
    return handleNativeException(
      callNative('mifareClassicSectorToBlock', [sector]),
    );
  }

  async mifareClassicReadBlock(block) {
    return handleNativeException(callNative('mifareClassicReadBlock', [block]));
  }

  async mifareClassicReadSector(sector) {
    return handleNativeException(
      callNative('mifareClassicReadSector', [sector]),
    );
  }

  async mifareClassicWriteBlock(block, data) {
    if (
      !data ||
      !Array.isArray(data) ||
      data.length !== this.nfcManager.MIFARE_BLOCK_SIZE
    ) {
      throw new Error(
        `data should be a non-empty Array[${this.nfcManager.MIFARE_BLOCK_SIZE}] of integers (0 - 255)`,
      );
    }

    return handleNativeException(
      callNative('mifareClassicWriteBlock', [block, data]),
    );
  }

  async mifareClassicIncrementBlock(block, value) {
    if (
      !value ||
      Number.isNaN(value)) {
      throw new Error(
        `value should be a number`,
      );
    }

    return handleNativeException(
      callNative('mifareClassicIncrementBlock', [block, value]),
    );
  }

  async mifareClassicDecrementBlock(block, value) {
    if (
      !value ||
      Number.isNaN(value)) {
      throw new Error(
        `value should be a number`,
      );
    }

    return handleNativeException(
      callNative('mifareClassicDecrementBlock', [block, value]),
    );
  }
  async mifareClassicTransferBlock(block) {
    if (
      !block ||
      Number.isNaN(block)) {
      throw new Error(
        `block should be a number`,
      );
    }

    return handleNativeException(
      callNative('mifareClassicTransferBlock', [block]),
    );
  }

}

export {MifareClassicHandlerAndroid};
