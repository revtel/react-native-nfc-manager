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

⚠ Please see [here](setup.md) ⚠

### Android 12

To support Android 12, you will need to update `compileSdkVersion` in your `android/build.gradle` like this:

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

The reason for this is because Android puts new limitation on [PendingIntent](https://developer.android.com/reference/android/app/PendingIntent#FLAG_MUTABLE):

> Starting with Build.VERSION_CODES.S, it will be required to explicitly specify the mutability of PendingIntents

The original issue is [here](https://github.com/revtel/react-native-nfc-manager/issues/469)

## Also See

### [Demo App] NfcOpenReWriter

We have a full featured NFC utility app available for download.

<a href='https://apps.apple.com/tw/app/nfc-rewriter/id1551243964' target='_blank'>
<img alt="react-native-nfc-rewriter" src="./images/Apple-App-Store-Icon.png" width="250">
</a>

</br>

<a href='https://play.google.com/store/apps/details?id=com.washow.nfcopenrewriter' target='_blank'>
<img alt="react-native-nfc-rewriter" src="./images/google-play-icon.jpeg" width="250">
</a>

It also open sourced in this repo: [React Native NFC ReWriter App](https://github.com/revtel/react-native-nfc-rewriter)

## Basic Usage

If all you want to do is to read `NDEF` data, you can use this example:

```javascript
import React, {useEffect, useMemo, useState} from 'react';
import nfcManager, {
  NfcError,
  NfcEvents,
  TagEvent,
} from 'react-native-nfc-manager';

interface INDEFContext {
  latestTag?: TagEvent;
  scanStatus: string;
}

export const NDEFContext = React.createContext({} as INDEFContext);

export const NDEFProvider: React.FC = props => {
  const [latestTag, setLatestTag] = useState<TagEvent>();
  const [scanStatus, setScanStatus] = useState('idle');

  useEffect(() => {
    nfcManager.setEventListener(NfcEvents.DiscoverTag, tagDiscovered);
    nfcManager.setEventListener(
      NfcEvents.DiscoverBackgroundTag,
      backgroundTagDiscovered,
    );
    nfcManager.setEventListener(NfcEvents.StateChanged, stateChanged);
    nfcManager.setEventListener(NfcEvents.SessionClosed, sessionClosed);
    return () => {
      nfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      nfcManager.setEventListener(NfcEvents.DiscoverBackgroundTag, null);
      nfcManager.setEventListener(NfcEvents.StateChanged, stateChanged);
      nfcManager.setEventListener(NfcEvents.SessionClosed, null);
    };
  }, [nfcManager]);

  // await this promise to only perform operations once NFC has initialized, but NFC
  // field will be active in the background. Scans will happen
  const nfcStartup = useMemo(() => {
    return nfcManager.isSupported().then(isSupported => {
      if (isSupported) {
        return nfcManager.start();
      } else {
        throw new Error('NFC is not supported on this device');
      }
    });
  }, [nfcManager]);

  const tagDiscovered = (tag: TagEvent) => {
    console.log('tag discovered', tag);
    setLatestTag(tag);
  };

  const backgroundTagDiscovered = (tag: TagEvent) => {
    console.log('background tag discovered', tag);
    setLatestTag(tag);
  };

  const stateChanged = (evt: {state: string}) => {
    console.log('state change', evt.state);
    setScanStatus(evt.state);
  };

  const sessionClosed = (error?: NfcError.NfcErrorBase) => {
    if (error) {
      console.error('NFC session closed with error', error);
    }
  };

  const value = {latestTag, scanStatus};

  return (
    <NDEFContext.Provider value={value}>{props.children}</NDEFContext.Provider>
  );
};
```

Anything else, ex: write NDEF, send custom command, please read next section.

## Advanced Usage

In high level, there're 3 steps to perform advanced NFC operations:

1. request your specific NFC technology
2. select the proper NFC technology handler, which is implemented as getter in main `NfcManager` object, including:
   - ndefHandler
   - nfcAHandler
   - isoDepHandler
   - iso15693HandlerIOS
   - mifareClassicHandlerAndroid
   - mifareUltralightHandlerAndroid
3. call specific methods on the NFC technology handler
4. clean up your tech registration

For example, here's an example to write NDEF:

```javascript
import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';

// Pre-step, call this before any NFC operations
async function initNfc() {
  await NfcManager.start();
}

async function writeNdef({type, value}) {
  let result = false;

  try {
    // Step 1
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: 'Ready to write some NDEF',
    });

    const bytes = Ndef.encodeMessage([Ndef.textRecord('Hello NFC')]);

    if (bytes) {
      await NfcManager.ndefHandler // Step2
        .writeNdefMessage(bytes); // Step3

      if (Platform.OS === 'ios') {
        await NfcManager.setAlertMessageIOS('Successfully write NDEF');
      }
    }

    result = true;
  } catch (ex) {
    console.warn(ex);
  }

  // Step 4
  NfcManager.cancelTechnologyRequest().catch(() => 0);
  return result;
}
```

## Advanced: Mifare Ultralight usage

Here's an example to read a Mifare Ultralight tag:

```javascript
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

// Pre-step, call this before any NFC operations
async function initNfc() {
  await NfcManager.start();
}

async function readMifare() {
  try {
    // 0. Request Mifare technology
    let reqMifare = await NfcManager.requestTechnology(
      NfcTech.MifareUltralight,
    );
    if (reqMifare !== 'MifareUltralight') {
      throw new Error(
        '[NFC Read] [ERR] Mifare technology could not be requested',
      );
    }

    // 1. Get NFC Tag information
    const nfcTag = await NfcManager.getTag();
    console.log('[NFC Read] [INFO] Tag: ', nfcTag);

    // 2. Read pages
    const readLength = 60;
    let mifarePages = [];
    const mifarePagesRead = await Promise.all(
      [...Array(readLength).keys()].map(async (_, i) => {
        const pageOffset = i * 4; // 4 Pages are read at once, so offset should be in steps with length 4
        let pages = await NfcManager.mifareUltralightHandlerAndroid.mifareUltralightReadPages(
          pageOffset,
        );
        mifarePages.push(pages);
        console.log(`[NFC Read] [INFO] Mifare Page: ${pageOffset}`, pages);
        //await wait(500); // If Mifare Chip is to slow
      }),
    );

    // 3. Success
    console.log('[NFC Read] [INFO] Success reading Mifare');

    // 4. Cleanup
    _cleanup();
  } catch (ex) {
    console.warn('[NFC Read] [ERR] Failed Reading Mifare: ', ex);
    _cleanup();
  }
}

function _cleanup() {
  NfcManager.cancelTechnologyRequest().catch(() => 0);
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

