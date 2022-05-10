# react-native-nfc-manager

[![npm version](https://img.shields.io/npm/v/react-native-nfc-manager.svg?style=flat)](https://www.npmjs.com/package/react-native-nfc-manager)
[![build](https://api.travis-ci.org/whitedogg13/react-native-nfc-manager.svg?branch=master)](https://travis-ci.org/whitedogg13/react-native-nfc-manager)
[![issues](https://img.shields.io/github/issues/whitedogg13/react-native-nfc-manager.svg?style=flat)](https://github.com/whitedogg13/react-native-nfc-manager/issues)

Bring NFC feature to React Native. Inspired by [phonegap-nfc](https://github.com/chariotsolutions/phonegap-nfc) and [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager)

Contributions are welcome!

Made with ❤️ by [whitedogg13](https://github.com/whitedogg13) and [revteltech](https://github.com/revtel)

## Install

### javascript part

```shell
npm i --save react-native-nfc-manager
```

### native part

This library use native-modules, so you will need to do `pod install` for iOS:

```shell
cd ios && pod install && cd ..
```

For Android, it should be properly auto-linked, so you don't need to do anything.

## Setup

Please see [here](setup.md)

### **Android 12**

We start to support Android 12 from `v3.11.1`, and you will need to update `compileSdkVersion` to `31`, otherwise the build will fail:

```
buildscript {
    ext {
        ...
        compileSdkVersion = 31
        ...
    }
    ...
}
```

The reason for this is because Android puts new limitation on [PendingIntent](https://developer.android.com/reference/android/app/PendingIntent#FLAG_MUTABLE) which says `Starting with Build.VERSION_CODES.S, it will be required to explicitly specify the mutability of PendingIntents`

> The original issue is [here](https://github.com/revtel/react-native-nfc-manager/issues/469)

BTW, if you don't care about **Android 12** for now, you can use **`v3.11.0`** as a short term solution.

### **[Demo App] NfcOpenReWriter**

We have a full featured NFC utility app using this library available for download.

<a href='https://apps.apple.com/tw/app/nfc-rewriter/id1551243964' target='_blank'>
<img alt="react-native-nfc-rewriter" src="./images/Apple-App-Store-Icon.png" width="250">
</a>

</br>

<a href='https://play.google.com/store/apps/details?id=com.washow.nfcopenrewriter' target='_blank'>
<img alt="react-native-nfc-rewriter" src="./images/google-play-icon.jpeg" width="250">
</a>

It also open sourced in this repo: [React Native NFC ReWriter App](https://github.com/revtel/react-native-nfc-rewriter)

## Learn

We have published a React Native NFC course with [newline.co](https://www.newline.co/), check it out!
- Free course (1 hour) about basic NFC setup and concept [here](https://www.youtube.com/watch?v=rAS-DvNUFck)
- Full course (3 hours) for more (NDEF, Deep Linking, NTAG password protection, signature with UID) [here](https://www.newline.co/courses/newline-guide-to-nfcs-with-react-native)

## Usage

The simplest (and most common) use case for this library is to read `NFC` tags containing `NDEF`, which can be achieved via the following codes:

```javascript
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

// Pre-step, call this before any NFC operations
NfcManager.start();

function App() {
  async function readNdef() {
    try {
      // register for the NFC tag with NDEF in it
      await NfcManager.requestTechnology(NfcTech.Ndef);
      // the resolved tag object will contain `ndefMessage` property
      const tag = await NfcManager.getTag();
      console.warn('Tag found', tag);
    } catch (ex) {
      console.warn('Oops!', ex);
    } finally {
      // stop the nfc scanning
      NfcManager.cancelTechnologyRequest();
    }
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={readNdef}>
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

Pleaes notice when running above codes, iOS and Android has different behaviors:

- iOS will pop up a system scanning UI
- Android provides **NO** system scanning UI

Regarding the system scannning UI, both platforms should be able to scan your NFC tags succesfully and print out its content.

### Old Style (registerTagEvent) To Scan NFC Tags

There's an alterntaive style to scan NFC tags through `NfcManager.registerTagEvent`, like this:

```javascript
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

// The following function resolves to a NFC Tag object using old event listener approach.
// You can call it like this:
//    `const nfcTag = await listenToNfcEventOnce()`

function listenToNfcEventOnce() {
  const cleanUp = () => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
  };

  return new Promise((resolve) => {
    let tagFound = null;

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
      tagFound = tag;
      resolve(tagFound);
      NfcManager.unregisterTagEvent();
    });

    NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
      cleanUp();
      if (!tagFound) {
        resolve();
      }
    });

    NfcManager.registerTagEvent();
  });
}
```

As you can see, the above approach is more verbose and hard-to-read, so we recommend using `NfcManager.requestTechnology` instead of `NfcManager.registerTagEvent` in your application.

## Advanced Usage Concept

In higher level, there're 4 steps to use this library:

1. request your particular NFC technologies through `NfcManager.requestTechnology`, for example:

   - `Ndef`
   - `NfcA`
   - `NfcB` (Android-only)
   - `NfcF` (Android-only)
   - `NfcV` (Android-only)
   - `IsoDep`
   - `MifareClassic` (Android-only)
   - `MifareUltralight` (Android-only)
   - `MifareIOS` (ios-only)
   - `Iso15693IOS` (ios-only)
   - `FelicaIOS` (ios-only)

2. select the proper NFC technology handler, which is implemented as getter in main `NfcManager` object, for example:

   - `ndefHandler` (for `Ndef` tech)
   - `nfcAHandler` (for `NfcA` tech)
   - `isoDepHandler` (for `IsoDep` tech)
   - `iso15693HandlerIOS` (for `Iso15693IOS` tech)
   - `mifareClassicHandlerAndroid` (for `mifareClassic` tech)
   - `mifareUltralightHandlerAndroid` (for `mifareUltralight` tech)
   - ... and so on

3. call specific methods on the NFC technology handler (for example `NfcManager.ndefHandler.writeNdefMessage`). To view all available methods for some tech handler, check out the [API List](index.d.ts)

4. clean up your tech registration through `NfcManager.cancelTechnology`

## Advanced Usage Example: NDEF-Writing

For example, here's an example to write NDEF:

```javascript
import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';

async function writeNdef({type, value}) {
  let result = false;

  try {
    // STEP 1
    await NfcManager.requestTechnology(NfcTech.Ndef);

    const bytes = Ndef.encodeMessage([Ndef.textRecord('Hello NFC')]);

    if (bytes) {
      await NfcManager.ndefHandler // STEP 2
        .writeNdefMessage(bytes); // STEP 3
      result = true;
    }
  } catch (ex) {
    console.warn(ex);
  } finally {
    // STEP 4
    NfcManager.cancelTechnologyRequest();
  }

  return result;
}
```

## Advanced Usage Example: Mifare Ultralight

Here's another example to read a Mifare Ultralight tag:

```javascript
async function readMifare() {
  let mifarePages = [];

  try {
    // STEP 1
    let reqMifare = await NfcManager.requestTechnology(
      NfcTech.MifareUltralight,
    );

    const readLength = 60;
    const mifarePagesRead = await Promise.all(
      [...Array(readLength).keys()].map(async (_, i) => {
        const pages = await NfcManager.mifareUltralightHandlerAndroid // STEP 2
          .mifareUltralightReadPages(i * 4); // STEP 3
        mifarePages.push(pages);
      }),
    );
  } catch (ex) {
    console.warn(ex);
  } finally {
    // STEP 4
    NfcManager.cancelTechnologyRequest();
  }

  return mifarePages;
}
```

To see more examples, please see [React Native NFC ReWriter App](https://github.com/revtel/react-native-nfc-rewriter)

## API

Please see [here](index.d.ts)

## FAQ

Please see [here](FAQ.md)

## Expo

> This package cannot be used in the "Expo Go" app because [it requires custom native code](https://docs.expo.io/workflow/customizing/).

After installing this npm package, add the [config plugin](https://docs.expo.io/guides/config-plugins/) to the [`plugins`](https://docs.expo.io/versions/latest/config/app/#plugins) array of your `app.json` or `app.config.js`:

```json
{
  "expo": {
    "plugins": ["react-native-nfc-manager"]
  }
}
```

Next, rebuild your app as described in the ["Adding custom native code"](https://docs.expo.io/workflow/customizing/) guide.

> Notice: This Config Plugin will ensure the minimum Android SDK version is 31.

#### Props

The plugin provides props for extra customization. Every time you change the props or plugins, you'll need to rebuild (and `prebuild`) the native app. If no extra properties are added, defaults will be used.

- `nfcPermission` (_string | false_): Sets the iOS `NFCReaderUsageDescription` permission message to the `Info.plist`. Setting `false` will skip adding the permission. Defaults to `Allow $(PRODUCT_NAME) to interact with nearby NFC devices` (Info.plist).
- `selectIdentifiers` (_string[]_): Sets the iOS [`com.apple.developer.nfc.readersession.iso7816.select-identifiers`](https://developer.apple.com/documentation/bundleresources/information_property_list/select-identifiers) to a list of supported application IDs (Info.plist).
- `systemCodes` (_string[]_): Sets the iOS [`com.apple.developer.nfc.readersession.felica.systemcodes`](https://developer.apple.com/documentation/bundleresources/information_property_list/systemcodes) to a user provided list of FeliCa™ system codes that the app supports (Info.plist). Each system code must be a discrete value. The wild card value (`0xFF`) isn't allowed.

#### Example

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-nfc-manager",
        {
          "nfcPermission": "Custom permission message",
          "selectIdentifiers": ["A0000002471001"],
          "systemCodes": ["8008"]
        }
      ]
    ]
  }
}
```
