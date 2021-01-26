import {callNative} from '../NativeNfcManager';

const Nfc15693RequestFlagIOS = {
  DualSubCarriers: 1 << 0,
  HighDataRate: 1 << 1,
  ProtocolExtension: 1 << 3,
  Select: 1 << 4,
  Address: 1 << 5,
  Option: 1 << 6,
};

class Iso15693HandlerIOS {
  getSystemInfo(requestFlag) {
    return callNative('iso15693_getSystemInfo', [requestFlag]);
  }

  readSingleBlock({flags, blockNumber}) {
    return callNative('iso15693_readSingleBlock', [{flags, blockNumber}]);
  }

  readMultipleBlocks({flags, blockNumber, blockCount}) {
    return callNative('iso15693_readMultipleBlocks', [
      {flags, blockNumber, blockCount},
    ]);
  }

  writeSingleBlock({flags, blockNumber, dataBlock}) {
    return callNative('iso15693_writeSingleBlock', [
      {flags, blockNumber, dataBlock},
    ]);
  }

  lockBlock({flags, blockNumber}) {
    return callNative('iso15693_lockBlock', [{flags, blockNumber}]);
  }

  writeAFI({flags, afi}) {
    return callNative('iso15693_writeAFI', [{flags, afi}]);
  }

  lockAFI({flags}) {
    return callNative('iso15693_lockAFI', [{flags}]);
  }

  writeDSFID({flags, dsfid}) {
    return callNative('iso15693_writeDSFID', [{flags, dsfid}]);
  }

  lockDSFID({flags}) {
    return callNative('iso15693_lockDSFID', [{flags}]);
  }

  resetToReady({flags}) {
    return callNative('iso15693_resetToReady', [{flags}]);
  }

  select({flags}) {
    return callNative('iso15693_select', [{flags}]);
  }

  stayQuite() {
    return callNative('iso15693_stayQuiet');
  }

  customCommand({flags, customCommandCode, customRequestParameters}) {
    return callNative('iso15693_customCommand', [
      {flags, customCommandCode, customRequestParameters},
    ]);
  }

  extendedReadSingleBlock({flags, blockNumber}) {
    return callNative('iso15693_extendedReadSingleBlock', [
      {flags, blockNumber},
    ]);
  }

  extendedWriteSingleBlock({flags, blockNumber, dataBlock}) {
    return callNative('iso15693_extendedWriteSingleBlock', [
      {flags, blockNumber, dataBlock},
    ]);
  }

  extendedLockBlock({flags, blockNumber}) {
    return callNative('iso15693_extendedLockBlock', [{flags, blockNumber}]);
  }
}

export {Nfc15693RequestFlagIOS, Iso15693HandlerIOS};
