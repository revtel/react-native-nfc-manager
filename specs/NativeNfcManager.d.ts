import type { TurboModule } from 'react-native';
export interface Spec extends TurboModule {
    echo(value: string, callback: (err?: string, resp?: string) => void): void;
}
declare const _default: Spec;
export default _default;
