import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  echo(value: string, callback: (err?: string, resp?: string) => void): void;
  isSupported(tech: string, callback: (err?: string, resp?: boolean) => void): void;
  isEnabled(callback: (err?: string, resp?: boolean) => void): void;
  start(callback: (err?: string) => void): void;
  requestTechnology(
      tech: string[],
      options: Object,
      callback: (err?: string, tech?: string) => void
  ): void;
  cancelTechnologyRequest(callback: (err?: string) => void): void;
  hasTagEventRegistration(callback: (err?: string, resp?: boolean) => void): void;
  registerTagEvent(
      options: Object,
      callback: (err?: string) => void
  ): void;
  unregisterTagEvent(callback: (err?: string) => void): void;
  getTag(callback: (err?: string, tag?: Object) => void): void;
  queryNdefStatus(callback: (err?: string, ndefStatus?: Object) => void): void;
  getBackgroundTag(callback: (err?: string, tag?: Object) => void): void;
  clearBackgroundTag(callback: (err?: string) => void): void;
  restartTechnologyRequest(callback: (err?: string, tech?: string) => void): void;
  invalidateSession(callback: (err?: string) => void): void;
  invalidateSessionWithError(message: string, callback: (err?: string) => void): void;
  getNdefMessage(callback: (err?: string, tag?: Object) => void): void;
  writeNdefMessage(bytes: number[], options: Object, callback: (err?: string) => void): void;
  makeReadOnly(callback: (err?: string) => void): void;
  setAlertMessage(message: string, callback: (err?: string) => void): void;
  isSessionAvailable(callback: (err?: string, resp?: boolean) => void): void;
  isTagSessionAvailable(callback: (err?: string, resp?: boolean) => void): void;
  sendMifareCommand(bytes: number[], callback: (err?: string, bytes?: number[]) => void): void;
  sendCommandAPDU(payload: Object, callback: (err?: string, bytes?: number[], sw1?: number, sw2?: number) => void): void;
  sendCommandAPDUBytes(bytes: number[], callback: (err?: string, bytes?: number[], sw1?: number, sw2?: number) => void): void;
  sendFelicaCommand(bytes: number[], callback: (err?: string, bytes?: number[]) => void): void;
  addListener: (eventType: string) => void;
  removeListeners: (count: number) => void;
  iso15693_getSystemInfo(requestFlag: number, callback: (err?: string, systemInfo?: Object) => void): void;
  iso15693_readSingleBlock(options: Object, callback: (err?: string, bytes?: number[]) => void): void;
  iso15693_readMultipleBlocks(options: Object, callback: (err?: string, bytes?: number[]) => void): void;
  iso15693_writeSingleBlock(options: Object, callback: (err?: string) => void): void;
  iso15693_lockBlock(options: Object, callback: (err?: string) => void): void;
  iso15693_writeAFI(options: Object, callback: (err?: string) => void): void;
  iso15693_lockAFI(options: Object, callback: (err?: string) => void): void;
  iso15693_writeDSFID(options: Object, callback: (err?: string) => void): void;
  iso15693_lockDSFID(options: Object, callback: (err?: string) => void): void;
  iso15693_resetToReady(options: Object, callback: (err?: string) => void): void;
  iso15693_select(options: Object, callback: (err?: string) => void): void;
  iso15693_stayQuiet(options: Object, callback: (err?: string) => void): void;
  iso15693_customCommand(options: Object, callback: (err?: string, bytes?: number[]) => void): void;
  iso15693_sendRequest(options: Object, callback: (err?: string, responseFlag?: number, bytes?: number[]) => void): void;
  iso15693_extendedReadSingleBlock(options: Object, callback: (err?: string, bytes?: number[]) => void): void;
  iso15693_extendedReadMultipleBlocks(options: Object, callback: (err?: string, bytes?: number[]) => void): void;
  iso15693_extendedWriteSingleBlock(options: Object, callback: (err?: string) => void): void;
  iso15693_extendedLockBlock(options: Object, callback: (err?: string) => void): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NfcManager');
