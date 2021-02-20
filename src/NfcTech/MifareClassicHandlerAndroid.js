import {callNative} from '../NativeNfcManager';

class MifareClassicHandlerAndroid {
  constructor(nfcManager) {
    this.nfcManager = nfcManager;
  }

  async mifareClassicAuthenticateA(sector, key) {
    if (!key || !Array.isArray(key) || key.length !== 6) {
      throw new Error('key should be an Array[6] of integers (0 - 255)');
    }

    return callNative('mifareClassicAuthenticateA', [sector, key]);
  }

  async mifareClassicAuthenticateB(sector, key) {
    if (!key || !Array.isArray(key) || key.length !== 6) {
      throw new Error('key should be an Array[6] of integers (0 - 255)');
    }

    return callNative('mifareClassicAuthenticateB', [sector, key]);
  }

  async mifareClassicGetBlockCountInSector(sector) {
    return callNative('mifareClassicGetBlockCountInSector', [sector]);
  }

  async mifareClassicGetSectorCount() {
    return callNative('mifareClassicGetSectorCount');
  }

  async mifareClassicSectorToBlock(sector) {
    return callNative('mifareClassicSectorToBlock', [sector]);
  }

  async mifareClassicReadBlock(block) {
    return callNative('mifareClassicReadBlock', [block]);
  }

  async mifareClassicReadSector(sector) {
    return callNative('mifareClassicReadSector', [sector]);
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

    return callNative('mifareClassicWriteBlock', [block, data]);
  }
}

export {MifareClassicHandlerAndroid};
