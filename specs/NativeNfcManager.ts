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
}

export default TurboModuleRegistry.getEnforcing<Spec>('NfcManager');
