# react-native-nfc-manager

[![npm version](https://img.shields.io/npm/v/react-native-nfc-manager.svg?style=flat)](https://www.npmjs.com/package/react-native-nfc-manager)
[![build](https://api.travis-ci.org/whitedogg13/react-native-nfc-manager.svg?branch=master)](https://travis-ci.org/whitedogg13/react-native-nfc-manager)
[![issues](https://img.shields.io/github/issues/whitedogg13/react-native-nfc-manager.svg?style=flat)](https://github.com/whitedogg13/react-native-nfc-manager/issues)

Bring NFC feature to React Native. Inspired by [phonegap-nfc](https://github.com/chariotsolutions/phonegap-nfc) and [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager)

Contributions are welcome!

> We also have a slack channel, you're welcome to chat with us for any issue or idea! [join us here](https://join.slack.com/t/reactnativenf-ewh2625/shared_invite/zt-puz9y22v-3rkORO6_zQe4FmaWm6ku_w)

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

## Demo App

We have a full featured NFC utility app available for download.

<a href='https://apps.apple.com/tw/app/nfc-rewriter/id1551243964' target='_blank'>
<img alt="react-native-nfc-rewriter" src="./images/Apple-App-Store-Icon.png" width="250">
</a>
<br/>

It also open sourced in this repo: [React Native NFC ReWriter App](https://github.com/revtel/react-native-nfc-rewriter)

## Basic Usage

If all you want to do is to read `NDEF` data, you can use this example:

```javascript
import NfcManager, {NfcEvents} from 'react-native-nfc-manager';

// Pre-step, call this before any NFC operations
async function initNfc() {
  await NfcManager.start();
}

function readNdef() {
  const cleanUp = () => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
  };

  return new Promise((resolve) => {
    let tagFound = null;

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
      tagFound = tag;
      resolve(tagFound);
      NfcManager.setAlertMessageIOS('NDEF tag found');
      NfcManager.unregisterTagEvent().catch(() => 0);
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

- `nfcPermission` (_string | false_): Sets the iOS `NFCReaderUsageDescription` permission message to the `Info.plist`. Setting `false` will skip adding the permission. Defaults to `Allow $(PRODUCT_NAME) to interact with nearby NFC devices`.
- `selectIdentifiers` (_string[]_): Sets the iOS [`com.apple.developer.nfc.readersession.iso7816.select-identifiers`](https://developer.apple.com/documentation/bundleresources/information_property_list/select-identifiers) entitlements to a list of supported application IDs.

#### Example

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-nfc-manager",
        {
          "nfcPermission": "Custom permission message",
          "selectIdentifiers": ["A0000002471001"]
        }
      ]
    ]
  }
}
```
