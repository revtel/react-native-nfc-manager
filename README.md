# react-native-nfc-manager

[![npm version](https://img.shields.io/npm/v/react-native-nfc-manager.svg?style=flat)](https://www.npmjs.com/package/react-native-nfc-manager)
[![CI](https://github.com/revtel/react-native-nfc-manager/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/revtel/react-native-nfc-manager/actions/workflows/ci.yml)

NFC for React Native, built for the **New Architecture** and **Expo Development Builds**.

Requires **React Native 0.76+ with the New Architecture**. Use an NFC-capable physical device to test scans.

## Installation

```sh
npm install react-native-nfc-manager@beta
```

v4 is currently beta. Pin the resolved version for reproducible installs. See [migration](docs/MIGRATING_V3_TO_V4.md) when upgrading an existing app.

<a id="setup"></a>

### Expo Development Builds

Expo Go cannot load this native module. Add the config plugin to `app.json`:

```json
{
  "expo": {
    "plugins": ["react-native-nfc-manager"]
  }
}
```

Install the development client and build the native app:

```sh
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios --device
# Or: npx expo run:android --device
npx expo start --dev-client
```

Rebuild after changing native dependencies or plugin options. For iOS capabilities and plugin options, see [Expo setup](docs/guide/expo.md).

### React Native CLI

<a id="ios"></a><a id="android"></a>

- **iOS:** run `pod install`, then configure [NFC capabilities and usage description](docs/guide/ios.md).
- **Android:** the module is autolinked; check [NFC permissions and device support](docs/guide/android.md), then rebuild the app.

<a id="gettingstarted"></a><a id="usageconcept"></a>

## Read an NDEF tag

Call this function from a user action. It prevents overlapping scans and awaits cleanup before allowing another request.

```javascript
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

let scanning = false;

async function readNdef() {
  if (scanning) return;
  scanning = true;
  let requestAttempted = false;
  try {
    await NfcManager.start();
    requestAttempted = true;
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    console.log('NDEF records', tag?.ndefMessage ?? []);
  } catch (error) {
    console.warn('NFC scan ended', error);
  } finally {
    try {
      if (requestAttempted) {
        await NfcManager.cancelTechnologyRequest();
      }
    } catch (cleanupError) {
      console.warn('NFC cleanup failed', cleanupError);
    } finally {
      scanning = false;
    }
  }
}
```

For a complete React screen and session lifecycle, see [reading NDEF tags](docs/guide/reading-ndef.md).

<a id="nfccompatibility"></a>

## Technology support

| Technology | Android | iOS |
| --- | --- | --- |
| NDEF, NFC-A, ISO-DEP | ✅ | ✅ |
| NFC-V / ISO 15693 | `NfcV` | `Iso15693IOS` |
| MIFARE | `MifareClassic`, `MifareUltralight` | `MifareIOS` |
| FeliCa | `NfcF` | `FelicaIOS` |

See the [full technology and handler table](docs/reference/compatibility.md). Actual tag support depends on the device and OS.

<a id="docs"></a><a id="api"></a>

## Documentation

Start with the [v4 documentation index](docs/index.md).

- [Installation and runtime requirements](docs/guide/installation.md)
- [Expo setup](docs/guide/expo.md) · [iOS setup](docs/guide/ios.md) · [Android setup](docs/guide/android.md)
- [API and handlers](docs/reference/api.md)
- [Expo troubleshooting](docs/EXPO_TROUBLESHOOTING.md)
- [Support policy](docs/SUPPORT_POLICY.md) · [Changelog](CHANGELOG.md)

<a id="development-example"></a><a id="appdemo"></a><a id="learn"></a>

## Examples and contributing

The [development example](example/README.md) exercises the New Architecture API. [Contributing](docs/CONTRIBUTING.md) includes build instructions and the NFC ReWriter app.

Created by [whitedogg13](https://github.com/whitedogg13).
