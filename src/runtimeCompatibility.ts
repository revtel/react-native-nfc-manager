import {Platform} from 'react-native';

const runtime = global as typeof global & {
  'RN$Bridgeless'?: boolean;
  __turboModuleProxy?: unknown;
  nativeFabricUIManager?: unknown;
};

let warned = false;

// This is a diagnostic, not a native-module availability check.
export function warnRuntimeCompatibility(): void {
  if (typeof __DEV__ === 'undefined' || !__DEV__ || warned) {
    return;
  }

  const version = Platform.constants?.reactNativeVersion;
  if (
    !version ||
    !Number.isInteger(version.major) ||
    !Number.isInteger(version.minor) ||
    version.major < 0 ||
    version.minor < 0
  ) {
    return;
  }

  const detected = `${version.major}.${version.minor}.${version.patch ?? 0}`;
  let message: string | undefined;
  if (version.major === 0 && version.minor < 76) {
    message = `React Native ${detected} is unsupported. v4 requires React Native 0.76+ with the New Architecture. Upgrade React Native and rebuild the native app.`;
  } else if (
    version.major === 0 &&
    version.minor < 82 &&
    runtime['RN$Bridgeless'] !== true &&
    runtime.nativeFabricUIManager == null &&
    runtime.__turboModuleProxy == null
  ) {
    message = `React Native ${detected} has no New Architecture runtime detected. v4 requires the New Architecture. Enable it in your app and rebuild the native app.`;
  }

  if (message) {
    warned = true;
    console.warn(`[react-native-nfc-manager] ${message}`);
  }
}
