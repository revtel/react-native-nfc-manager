# Installation

v4 requires React Native 0.76+ with the New Architecture. On RN 0.76–0.81, enable the New Architecture in the native app; RN 0.82+ uses it exclusively. See the [support policy](../SUPPORT_POLICY.md) for the tested version window.

```sh
npm install react-native-nfc-manager
```

v4 is available on npm `latest`. Pin the resolved version for reproducible installs. When upgrading an existing application, follow the [migration guide](../MIGRATING_V3_TO_V4.md).

## Choose your setup

| Application | Next step |
| --- | --- |
| Expo | [Configure the plugin and build a Development Build](./expo.md) |
| React Native CLI on iOS | [Install Pods and configure NFC capabilities](./ios.md) |
| React Native CLI on Android | [Check autolinking and NFC permissions](./android.md) |

Expo Go cannot load this native module. A native rebuild is required after installing the package or changing native configuration; refreshing Metro does not replace the binary.

## Runtime diagnostics

Development builds warn once when a known React Native version is below the support floor, or when RN 0.76–0.81 has no recognized New Architecture runtime signals. Detection is a best-effort diagnostic. A missing native module has separate linking/rebuild guidance, including the Expo Development Build requirement.

After setup, [read an NDEF tag](./reading-ndef.md) on a physical NFC-capable device.
