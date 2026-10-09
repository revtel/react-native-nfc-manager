# Android setup

React Native autolinking connects the native module after installing the package. Rebuild the Android app to include it. For Expo, follow the [Development Build guide](./expo.md).

## NFC permission

The library manifest contributes the NFC permission and declares NFC hardware optional. Check that the merged application manifest includes:

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="false" />
```

If your app manages these settings itself, add the permission in its `AndroidManifest.xml`. Expo's `nfcPermission: false` option blocks the library-contributed permission, so the app must supply equivalent configuration before NFC use.

## Toolchain and device

Use the Android SDK, build tools, NDK and Java versions required by your React Native version. The development example uses RN 0.84; see its [toolchain guide](https://github.com/revtel/react-native-nfc-manager/blob/main/example/README.md).

Use `isSupported()` to check hardware support and `isEnabled()` to check the adapter state. NFC scans require a physical NFC-capable Android device. Continue with [reading NDEF tags](./reading-ndef.md).
