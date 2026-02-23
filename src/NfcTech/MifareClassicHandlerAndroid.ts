import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

type Byte = number;
type ByteArray = Byte[];

type AndroidMifareManager = {
  MIFARE_BLOCK_SIZE: number;
};

class MifareClassicHandlerAndroid {
  nfcManager: AndroidMifareManager;

  constructor(nfcManager: AndroidMifareManager) {
    this.nfcManager = nfcManager;
  }

  async mifareClassicAuthenticateA(sector: number, key: ByteArray): Promise<boolean> {
    if (!key || !Array.isArray(key) || key.length !== 6) {
      throw new Error('key should be an Array[6] of integers (0 - 255)');
    }

    return handleNativeException(
      callNative('mifareClassicAuthenticateA', [sector, key]),
    ) as Promise<boolean>;
  }

  async mifareClassicAuthenticateB(sector: number, key: ByteArray): Promise<boolean> {
    if (!key || !Array.isArray(key) || key.length !== 6) {
      throw new Error('key should be an Array[6] of integers (0 - 255)');
    }

    return handleNativeException(
      callNative('mifareClassicAuthenticateB', [sector, key]),
    ) as Promise<boolean>;
  }

  async mifareClassicGetBlockCountInSector(sector: number): Promise<number> {
    return handleNativeException(
      callNative('mifareClassicGetBlockCountInSector', [sector]),
    ) as Promise<number>;
  }

  async mifareClassicGetSectorCount(): Promise<number> {
    return handleNativeException(callNative('mifareClassicGetSectorCount')) as Promise<number>;
  }

  async mifareClassicSectorToBlock(sector: number): Promise<number> {
    return handleNativeException(
      callNative('mifareClassicSectorToBlock', [sector]),
    ) as Promise<number>;
  }

  async mifareClassicReadBlock(block: number): Promise<ByteArray> {
    return handleNativeException(callNative('mifareClassicReadBlock', [block])) as Promise<ByteArray>;
  }

  async mifareClassicReadSector(sector: number): Promise<ByteArray> {
    return handleNativeException(
      callNative('mifareClassicReadSector', [sector]),
    ) as Promise<ByteArray>;
  }

  async mifareClassicWriteBlock(block: number, data: ByteArray): Promise<boolean> {
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
    ) as Promise<boolean>;
  }

  async mifareClassicIncrementBlock(block: number, value: number): Promise<boolean> {
    if (
      !value ||
      Number.isNaN(value)) {
      throw new Error(
        `value should be a number`,
      );
    }

    return handleNativeException(
      callNative('mifareClassicIncrementBlock', [block, value]),
    ) as Promise<boolean>;
  }

  async mifareClassicDecrementBlock(block: number, value: number): Promise<boolean> {
    if (
      !value ||
      Number.isNaN(value)) {
      throw new Error(
        `value should be a number`,
      );
    }

    return handleNativeException(
      callNative('mifareClassicDecrementBlock', [block, value]),
    ) as Promise<boolean>;
  }

  async mifareClassicTransferBlock(block: number): Promise<boolean> {
    if (
      !block ||
      Number.isNaN(block)) {
      throw new Error(
        `block should be a number`,
      );
    }

    return handleNativeException(
      callNative('mifareClassicTransferBlock', [block]),
    ) as Promise<boolean>;
  }
}

export {MifareClassicHandlerAndroid};
