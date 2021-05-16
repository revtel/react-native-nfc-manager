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

## Latest Changes

`v2` to `v3` is primarily a refactor, to let long-term maintain easier. During the refactor, there're also several major enhancements:

- Separate each NFC technology into its own handler, and provide `getter` from main `NfcManager` object to access them. This way we can avoid namespace corrupting due to individual tech methods.
- Provide `compatibility layer` for common NFC tech handler, such as `NfcA` or `IsoDep`, so we don't need to do lots of if/else according to `Platform.OS`.

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

## Legacy (v1, v2) docs

Please see [v2 branch](https://github.com/whitedogg13/react-native-nfc-manager/tree/v2)
