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

## NFC antenna location

On Android 14 (API 34) and newer, `getNfcAntennaInfo()` reports where the NFC antenna is, so an app can show users where to hold a tag:

```javascript
const info = await NfcManager.getNfcAntennaInfo();
// {deviceWidth: 77, deviceHeight: 161, deviceFoldable: false,
//  availableNfcAntennas: [{locationX: 23, locationY: 45}]}
```

Values are in millimeters, measured from the bottom-left corner with the screen facing the user in portrait (unfolded, on foldables). It resolves `null` below Android 14 or without an NFC adapter. Devices whose manufacturer doesn't configure the antenna layout return an empty `availableNfcAntennas` list. Android only.
