# react-native-nfc-manager

[![npm version](https://img.shields.io/npm/v/react-native-nfc-manager.svg?style=flat)](https://www.npmjs.com/package/react-native-nfc-manager)
[![CI](https://github.com/revtel/react-native-nfc-manager/actions/workflows/ci.yml/badge.svg?branch=v4)](https://github.com/revtel/react-native-nfc-manager/actions/workflows/ci.yml)
[![issues](https://img.shields.io/github/issues/revtel/react-native-nfc-manager.svg?style=flat)](https://github.com/revtel/react-native-nfc-manager/issues)

NFC for React Native, with v4 built for the **New Architecture** and **Expo Development Builds**.

Inspired by [phonegap-nfc](https://github.com/chariotsolutions/phonegap-nfc) and [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager)

Contributions are welcome!

Made with ❤️ by [whitedogg13](https://github.com/whitedogg13) and [revteltech](https://github.com/revtel)

> Special thanks to [javix64](https://github.com/javix64) for restructuring the documentation!

Requires **React Native 0.76+ with the New Architecture**. Expo apps require a **Development Build**.

## Table of Contents

1. [Installation](#installation)
2. [Expo Development Builds](#expo-development-builds)
3. [Getting Started](#gettingstarted)
4. [Setup](#setup)
5. [Documentation](#docs)
6. [Nfc compatibility](#nfccompatibility)
7. [Usage Concept](#usageconcept)
8. [API](#api)
9. [App demo](#appdemo)
10. [Learn](#learn)
11. [Development Example](#development-example)

## Installation

<a name="installation"></a>

```shell
npm install react-native-nfc-manager@beta
```

v4 is currently in beta. Pin the resolved version for reproducible installs. See the [migration guide](https://github.com/revtel/react-native-nfc-manager/blob/v4/docs/MIGRATING_V3_TO_V4.md) when upgrading an existing application.

### Expo Development Builds

`react-native-nfc-manager` contains native code, so it does **not** work in Expo Go. Use an [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) generated locally or by EAS.

Install the package and add its config plugin to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-nfc-manager",
        {
          "nfcPermission": "Allow this app to scan nearby NFC tags"
        }
      ]
    ]
  }
}
```

- `nfcPermission` sets the iOS `NFCReaderUsageDescription` and enables the Android NFC permission. Omit it to use the default description.
- `nfcPermission: false` is an advanced opt-out: it omits the iOS usage description and blocks the Android permission contributed by the library manifest. NFC cannot be used until the application supplies equivalent native configuration itself.
- `includeNdefEntitlement` defaults to `true`; set it to `false` to add only the iOS `TAG` reader-session format. This does not remove NDEF already supplied by other configuration; see the entitlement troubleshooting guide.
- `selectIdentifiers` supplies iOS ISO 7816 application identifiers required by your target cards; these are application-specific.
- `systemCodes` supplies iOS FeliCa system codes required by your target cards.

Install the development client, then generate and build the native application:

```shell
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios --device
# or
npx expo run:android --device
npx expo start --dev-client
```

Rebuild the native app after changing native dependencies or plugin options; a Metro refresh cannot apply those changes. Use an NFC-capable physical device to test scans. On iOS, your App ID and provisioning must permit NFC.

For dependency, rebuild or entitlement problems, see [Expo troubleshooting](https://github.com/revtel/react-native-nfc-manager/blob/v4/docs/EXPO_TROUBLESHOOTING.md). Supported versions and recorded validation are in the [support policy](https://github.com/revtel/react-native-nfc-manager/blob/v4/docs/SUPPORT_POLICY.md).

### iOS

This library use native-modules, so you will need to do `pod install` for iOS:

```shell
cd ios && pod install && cd ..
```

Minimum Swift language version for iOS native sources is **Swift 5.7**.

### Android

It should be properly auto-linked, so you don't need to do anything.

## Setup

<a name="setup"></a>

### iOS

1. In [apple developer site](https://developer.apple.com/), enable capability for NFC

![enable capability](https://raw.githubusercontent.com/revtel/react-native-nfc-manager/v4/images/enable-capability.png "enable capability")

2. in Xcode, add `NFCReaderUsageDescription` into your `info.plist`, for example:

```
<key>NFCReaderUsageDescription</key>
<string>We need to use NFC</string>
```

More info on Apple's [doc](https://developer.apple.com/documentation/bundleresources/information_property_list/nfcreaderusagedescription?language=objc)

Additionally, if writing ISO7816 tags add application identifiers (aid) into your `info.plist` as needed like this.
```
<key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
<array>
  <string>D2760000850100</string>
  <string>D2760000850101</string>
</array>
```

More info on Apple's [doc](https://developer.apple.com/documentation/corenfc/nfciso7816tag)

**Note:** If you are using `NfcTech.FelicaIOS`, you must also add the following code to your `Info.plist` file, otherwise the library will crash:

```xml
<key>com.apple.developer.nfc.readersession.felica.systemcodes</key>
<array>
  <string>8005</string>
  <string>8008</string>
  <string>0003</string>
  <string>fe00</string>
  <string>90b7</string>
  <string>927a</string>
  <string>12FC</string>
  <string>86a7</string>
</array>
```

An incomplete list of aid's can be found here. [Application identifier](https://www.eftlab.com/knowledge-base/complete-list-of-application-identifiers-aid)

3. in Xcode's `Signing & Capabilities` tab, make sure `Near Field Communication Tag Reading` capability had been added, like this:

![xcode-add-capability](https://raw.githubusercontent.com/revtel/react-native-nfc-manager/v4/images/xcode-capability.png "xcode capability")

If this is the first time you toggle the capabilities, the Xcode will generate a `<your-project>.entitlement` file for you:

![xcode-add-entitlement](https://raw.githubusercontent.com/revtel/react-native-nfc-manager/v4/images/xcode-entitlement.png "xcode entitlement")

4. in Xcode, review the generated entitlement. It should look like this:

![edit entitlement](https://raw.githubusercontent.com/revtel/react-native-nfc-manager/v4/images/edit-entitlement.png "edit entitlement")

More info on Apple's [doc](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_nfc_readersession_formats?language=objc)

### Android

Simple add `uses-permission` into your `AndroidManifest.xml`:

```xml
 <uses-permission android:name="android.permission.NFC" />
```

Use the Android SDK, build tools, NDK, and Java versions required by your React Native version. Do not lower `compileSdkVersion` to an old v3 example value. The development example uses React Native 0.84 with the New Architecture enabled; its toolchain is documented in [example/README.md](https://github.com/revtel/react-native-nfc-manager/blob/v4/example/README.md).

## Getting Started

<a name="gettingstarted"></a>

The simplest (and most common) use case for this library is to read `NFC` tags containing `NDEF`, which can be achieved via the following codes:

```javascript
import React, {useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

function App() {
  const scanning = useRef(false);
  const [busy, setBusy] = useState(false);

  async function readNdef() {
    // A ref also blocks rapid taps before React renders the disabled button.
    if (scanning.current) return;
    scanning.current = true;
    setBusy(true);
    let requestAttempted = false;
    try {
      await NfcManager.start();
      requestAttempted = true;
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      console.warn('NDEF records', tag?.ndefMessage ?? []);
    } catch (ex) {
      // Includes initialization, request, cancellation and tag-I/O failures.
      console.warn('NFC scan ended', ex);
    } finally {
      try {
        if (requestAttempted) {
          // Await cleanup before permitting a subsequent scan.
          await NfcManager.cancelTechnologyRequest();
        }
      } catch (cleanupError) {
        console.warn('NFC cleanup failed', cleanupError);
      } finally {
        scanning.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={readNdef} disabled={busy}>
        <Text>Scan a Tag</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
```



## DOCUMENTATION

<a name="docs"></a>

Check the full documentation that contains `examples`, `faq`, and other topics in our [Wiki](https://github.com/revtel/react-native-nfc-manager/wiki). The Expo instructions above are the current v4 integration contract.

## Development Example

<a name="development-example"></a>

For local library development and physical-device NFC testing, use the React Native 0.84 New Architecture example app in [`example/`](https://github.com/revtel/react-native-nfc-manager/tree/v4/example). See [example/README.md](https://github.com/revtel/react-native-nfc-manager/blob/v4/example/README.md).

The example Jest suite mocks the native module and verifies application interactions only. It does not verify NFC hardware. Android and iOS compiler builds and physical-device checks are separate release gates.

### Build (TypeScript)

This project now uses a TypeScript build flow and emits distributable JavaScript to `dist/`:

```shell
npm run build
```

For package publishing, `prepack` runs the build automatically.

### Routine CI

CI on pull requests and `v4` pushes uses Node.js 22 for build, lint, public type checking, root and example mocked tests, package contents, and the RN 0.76.9 / 0.77.3 / 0.84.0 packed Codegen matrix. Separate Android and iOS jobs compile the RN 0.84 New Architecture example when relevant files change; documentation-only changes skip them. Manual CI runs force both builds for release candidates. These are compiler checks, not NFC hardware tests. Packed support-floor and Expo consumer builds remain additional release gates; see [Release Validation](https://github.com/revtel/react-native-nfc-manager/blob/v4/docs/RELEASING.md).

## Nfc Compatibility

<a name="nfccompatibility"></a>

|NFC Technologies   | Android | iOS  |
|---                |---      |---   |
| `Ndef`            | ✅      | ✅   |
| `NfcA`            | ✅      | ✅   |
| `IsoDep`          | ✅      | ✅   |
| `NfcB`            | ✅      | ❌   |
| `NfcF`            | ✅      | ❌   |
| `NfcV`            | ✅      | ❌   |
| `MifareClassic`   | ✅      | ❌   |
| `MifareUltralight`| ✅      | ❌   |
| `MifareIOS`       | ❌      | ✅   |
| `Iso15693IOS`     | ❌      | ✅   |
| `FelicaIOS`       | ❌      | ✅   |

This table describes the intended platform API availability. It is not a record of the devices, OS versions, or tag technologies verified for a particular release; see the [Support Policy](https://github.com/revtel/react-native-nfc-manager/blob/v4/docs/SUPPORT_POLICY.md) for evidence labels and limitations.

## Usage concept

<a name="usageconcept"></a>

In higher level, there're 4 steps to use this library:

0. Await `NfcManager.start()` to initialize the native module before requesting a technology. Initialization alone does not start a tag scan.


1. Request your particular NFC technologies through `NfcManager.requestTechnology`. Let's request `Ndef` techonogy.

```javascript
await NfcManager.requestTechnology(NfcTech.Ndef);
```

2. Select the proper NFC technology handler, which is implemented as getter in main `NfcManager` object.

```javascript
NfcManager.ndefHandler
```

3. Call specific methods on the NFC technology handler.

```javascript
await NfcManager.ndefHandler.getNdefMessage();
```

4. Clean up your tech registration through:

```javascript
await NfcManager.cancelTechnologyRequest();
```


## API

<a name="api"></a>

### Android cached tag metadata

Android tag results from discovery and `getTag()` may include these optional, discovery-time fields when the tag supports the corresponding technology:

| Technology | Fields |
| --- | --- |
| NFC-A | `atqa: number[]`, `sak: number` |
| NFC-V | `dsfid: number`, `responseFlags: number` |
| ISO-DEP | `historicalBytes: number[]`, `hiLayerResponse: number[]` |

Byte values are unsigned (0–255). An unsupported or unavailable field is omitted; check for its presence before using it. These values come from Android's cached tag discovery data and do not trigger another NFC command. The new NFC-A and NFC-V fields and `hiLayerResponse` are Android-only; `historicalBytes` can also be reported by iOS ISO 7816 tags. Compiler and mock tests do not establish physical-device behavior, so verify each technology with suitable hardware before relying on it in a release.

The [2026-09-29 device record](https://github.com/revtel/react-native-nfc-manager/blob/v4/docs/V4_RELEASE_VALIDATION_2026-09-29.md) observed NFC-A `atqa: [68, 0]` and `sak: 0` on Samsung SM-N975U1 / Android 12 with NTAG215. NFC-V and ISO-DEP metadata were not verified on hardware in that session.

The following table shows the handler for each technology, so if you need to use a technology, go to [index.d.ts](index.d.ts) and search for it.

|NFC Technologies   | Handlers |
|---                |---      |
| `Ndef`            | `NdefHandler` |
| `NfcA`            | `NfcAHandler` |
| `IsoDep`          | `IsoDepHandler` |
| `NfcB`            | - |
| `NfcF`            | - |
| `NfcV`            | `NfcVHandler` |
| `MifareClassic`   | `MifareClassicHandlerAndroid` |
| `MifareUltralight`| `MifareUltralightHandlerAndroid` |
| `MifareIOS`       | - |
| `Iso15693IOS`     | `Iso15693HandlerIOS` |
| `FelicaIOS`       | - |


## App Demo - NfcOpenReWriter

<a name="appdemo"></a>

We have a full featured NFC utility app using this library available for download. The source code is here: [**React Native NFC ReWriter App**](https://github.com/revtel/react-native-nfc-rewriter)

<a href='https://apps.apple.com/tw/app/nfc-rewriter/id1551243964' target='_blank'>
<img alt="react-native-nfc-rewriter" src="https://raw.githubusercontent.com/revtel/react-native-nfc-manager/v4/images/Apple-App-Store-Icon.png" width="250">
</a>

</br>

<a href='https://play.google.com/store/apps/details?id=com.washow.nfcopenrewriter' target='_blank'>
<img alt="react-native-nfc-rewriter" src="https://raw.githubusercontent.com/revtel/react-native-nfc-manager/v4/images/google-play-icon.jpeg" width="250">
</a>

## Learn

<a name="learn"></a>

We have published a React Native NFC course with [newline.co](https://www.newline.co/), check it out!
- Free course (1 hour) about basic NFC setup and concept [here](https://www.youtube.com/watch?v=rAS-DvNUFck)
- Full course (3 hours) for more (NDEF, Deep Linking, NTAG password protection, signature with UID) [here](https://www.newline.co/courses/newline-guide-to-nfcs-with-react-native)
