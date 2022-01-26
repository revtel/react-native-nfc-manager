import {callNative} from '../NativeNfcManager';
import {handleNativeException} from '../NfcError';

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
  getSystemInfo(requestFlag) {
    return handleNativeException(
      callNative('iso15693_getSystemInfo', [requestFlag]),
    );
  }

  readSingleBlock({flags, blockNumber}) {
    return handleNativeException(
      callNative('iso15693_readSingleBlock', [{flags, blockNumber}]),
    );
  }

  readMultipleBlocks({flags, blockNumber, blockCount}) {
    return handleNativeException(
      callNative('iso15693_readMultipleBlocks', [
        {flags, blockNumber, blockCount},
      ]),
    );
  }

  writeSingleBlock({flags, blockNumber, dataBlock}) {
    return handleNativeException(
      callNative('iso15693_writeSingleBlock', [
        {flags, blockNumber, dataBlock},
      ]),
    );
  }

  lockBlock({flags, blockNumber}) {
    return handleNativeException(
      callNative('iso15693_lockBlock', [{flags, blockNumber}]),
    );
  }

  writeAFI({flags, afi}) {
    return handleNativeException(
      callNative('iso15693_writeAFI', [{flags, afi}]),
    );
  }

  lockAFI({flags}) {
    return handleNativeException(callNative('iso15693_lockAFI', [{flags}]));
  }

  writeDSFID({flags, dsfid}) {
    return handleNativeException(
      callNative('iso15693_writeDSFID', [{flags, dsfid}]),
    );
  }

  lockDSFID({flags}) {
    return handleNativeException(callNative('iso15693_lockDSFID', [{flags}]));
  }

  resetToReady({flags}) {
    return handleNativeException(
      callNative('iso15693_resetToReady', [{flags}]),
    );
  }

  select({flags}) {
    return handleNativeException(callNative('iso15693_select', [{flags}]));
  }

  stayQuite() {
    return handleNativeException(callNative('iso15693_stayQuiet'));
  }

  customCommand({flags, customCommandCode, customRequestParameters}) {
    return handleNativeException(
      callNative('iso15693_customCommand', [
        {flags, customCommandCode, customRequestParameters},
      ]),
    );
  }

  // https://developer.apple.com/documentation/corenfc/nfciso15693tag/3551933-sendrequestwithflag?language=objc
  sendRequest({flags, commandCode, data}) {
    return handleNativeException(
      callNative('iso15693_sendRequest', [
        {flags, commandCode, data},
      ]),
    );
  }

  extendedReadSingleBlock({flags, blockNumber}) {
    return handleNativeException(
      callNative('iso15693_extendedReadSingleBlock', [{flags, blockNumber}]),
    );
  }

  extendedWriteSingleBlock({flags, blockNumber, dataBlock}) {
    return handleNativeException(
      callNative('iso15693_extendedWriteSingleBlock', [
        {flags, blockNumber, dataBlock},
      ]),
    );
  }

  extendedLockBlock({flags, blockNumber}) {
    return handleNativeException(
      callNative('iso15693_extendedLockBlock', [{flags, blockNumber}]),
    );
  }
}

export {Nfc15693RequestFlagIOS, Nfc15693ResponseFlagIOS, Iso15693HandlerIOS};
