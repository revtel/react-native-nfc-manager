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
}

export default TurboModuleRegistry.getEnforcing<Spec>('NfcManager');
