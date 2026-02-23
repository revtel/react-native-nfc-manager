import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

type Byte = number;
type ByteArray = Byte[];

type FlagsOnly = {flags: number};
type BlockOptions = {flags: number; blockNumber: number};
type MultiBlockOptions = {flags: number; blockNumber: number; blockCount: number};
type WriteBlockOptions = {flags: number; blockNumber: number; dataBlock: ByteArray};
type WriteAfiOptions = {flags: number; afi: number};
type WriteDsfidOptions = {flags: number; dsfid: number};
type CustomCommandOptions = {
  flags: number;
  customCommandCode: number;
  customRequestParameters: ByteArray;
};
type SendRequestOptions = {flags: number; commandCode: number; data: ByteArray};

type Iso15693SystemInfo = {
  dsfid: number;
  afi: number;
  blockSize: number;
  blockCount: number;
  icReference: number;
};

const Nfc15693RequestFlagIOS = {
  DualSubCarriers: 1 << 0,
  HighDataRate: 1 << 1,
  ProtocolExtension: 1 << 3,
  Select: 1 << 4,
  Address: 1 << 5,
  Option: 1 << 6,
  CommandSpecificBit8: 1 << 7,
};

const Nfc15693ResponseFlagIOS = {
  Error: 1 << 0,
  ResponseBufferValid: 1 << 1,
  FinalResponse: 1 << 2,
  ProtocolExtension: 1 << 3,
  BlockSecurityStatusBit5: 1 << 4,
  BlockSecurityStatusBit6: 1 << 5,
  WaitTimeExtension: 1 << 6
};

class Iso15693HandlerIOS {
  getSystemInfo(requestFlag: number): Promise<Iso15693SystemInfo> {
    return handleNativeException(
      callNative('iso15693_getSystemInfo', [requestFlag]),
    ) as Promise<Iso15693SystemInfo>;
  }

  readSingleBlock({flags, blockNumber}: BlockOptions): Promise<ByteArray> {
    return handleNativeException(
      callNative('iso15693_readSingleBlock', [{flags, blockNumber}]),
    ) as Promise<ByteArray>;
  }

  readMultipleBlocks({flags, blockNumber, blockCount}: MultiBlockOptions): Promise<ByteArray> {
    return handleNativeException(
      callNative('iso15693_readMultipleBlocks', [
        {flags, blockNumber, blockCount},
      ]),
    ) as Promise<ByteArray>;
  }

  writeSingleBlock({flags, blockNumber, dataBlock}: WriteBlockOptions): Promise<void> {
    return handleNativeException(
      callNative('iso15693_writeSingleBlock', [
        {flags, blockNumber, dataBlock},
      ]),
    ) as Promise<void>;
  }

  lockBlock({flags, blockNumber}: BlockOptions): Promise<void> {
    return handleNativeException(
      callNative('iso15693_lockBlock', [{flags, blockNumber}]),
    ) as Promise<void>;
  }

  writeAFI({flags, afi}: WriteAfiOptions): Promise<void> {
    return handleNativeException(
      callNative('iso15693_writeAFI', [{flags, afi}]),
    ) as Promise<void>;
  }

  lockAFI({flags}: FlagsOnly): Promise<void> {
    return handleNativeException(callNative('iso15693_lockAFI', [{flags}])) as Promise<void>;
  }

  writeDSFID({flags, dsfid}: WriteDsfidOptions): Promise<void> {
    return handleNativeException(
      callNative('iso15693_writeDSFID', [{flags, dsfid}]),
    ) as Promise<void>;
  }

  lockDSFID({flags}: FlagsOnly): Promise<void> {
    return handleNativeException(callNative('iso15693_lockDSFID', [{flags}])) as Promise<void>;
  }

  resetToReady({flags}: FlagsOnly): Promise<void> {
    return handleNativeException(
      callNative('iso15693_resetToReady', [{flags}]),
    ) as Promise<void>;
  }

  select({flags}: FlagsOnly): Promise<void> {
    return handleNativeException(callNative('iso15693_select', [{flags}])) as Promise<void>;
  }

  stayQuite(): Promise<void> {
    return handleNativeException(callNative('iso15693_stayQuiet')) as Promise<void>;
  }

  customCommand({flags, customCommandCode, customRequestParameters}: CustomCommandOptions): Promise<ByteArray> {
    return handleNativeException(
      callNative('iso15693_customCommand', [
        {flags, customCommandCode, customRequestParameters},
      ]),
    ) as Promise<ByteArray>;
  }

  // https://developer.apple.com/documentation/corenfc/nfciso15693tag/3551933-sendrequestwithflag?language=objc
  sendRequest({flags, commandCode, data}: SendRequestOptions): Promise<[number, ByteArray]> {
    return handleNativeException(
      callNative('iso15693_sendRequest', [
        {flags, commandCode, data},
      ]),
    ) as Promise<[number, ByteArray]>;
  }

  extendedReadSingleBlock({flags, blockNumber}: BlockOptions): Promise<ByteArray> {
    return handleNativeException(
      callNative('iso15693_extendedReadSingleBlock', [{flags, blockNumber}]),
    ) as Promise<ByteArray>;
  }

  extendedReadMultipleBlocks({flags, blockNumber, blockCount}: MultiBlockOptions): Promise<ByteArray> {
    return handleNativeException(
      callNative('iso15693_extendedReadMultipleBlocks', [
        {flags, blockNumber, blockCount},
      ]),
    ) as Promise<ByteArray>;
  }

  extendedWriteSingleBlock({flags, blockNumber, dataBlock}: WriteBlockOptions): Promise<void> {
    return handleNativeException(
      callNative('iso15693_extendedWriteSingleBlock', [
        {flags, blockNumber, dataBlock},
      ]),
    ) as Promise<void>;
  }

  extendedLockBlock({flags, blockNumber}: BlockOptions): Promise<void> {
    return handleNativeException(
      callNative('iso15693_extendedLockBlock', [{flags, blockNumber}]),
    ) as Promise<void>;
  }
}

export {Nfc15693RequestFlagIOS, Nfc15693ResponseFlagIOS, Iso15693HandlerIOS};
