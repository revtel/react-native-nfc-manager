# react-native-nfc-manager

[![npm version](https://img.shields.io/npm/v/react-native-nfc-manager.svg?style=flat)](https://www.npmjs.com/package/react-native-nfc-manager)
[![build](https://api.travis-ci.org/whitedogg13/react-native-nfc-manager.svg?branch=master)](https://travis-ci.org/whitedogg13/react-native-nfc-manager)
[![issues](https://img.shields.io/github/issues/whitedogg13/react-native-nfc-manager.svg?style=flat)](https://github.com/whitedogg13/react-native-nfc-manager/issues)

Bring NFC feature to React Native. Inspired by [phonegap-nfc](https://github.com/chariotsolutions/phonegap-nfc) and [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager)

Contributions are welcome!

## Supported Platforms
- Android (API 10+)
- iOS (iOS11 with iPhone 7/7+, 8/8+, 10)

## iOS Setup 

You will need to setup some capabilities / entitlement / plist stuff to enable NFC development on your device, this repo explains these requirements very well:

* https://github.com/hansemannn/iOS11-NFC-Example 

## Version history (from v0.1.0) 

v0.5.4
- (android) support `getTag` for all NFC technologies
- (android) update **compileSdkVersion** and **buildToolsVersion** to 26
- (ios) bug fix: clear event subscription when reader session closed

v0.5.2
- support **Android Beam** via `setNdefPushMessage` API [Android only]
    - please see `examples/App.js` for a concrete example
- new methods for `NfcTech.Ndef` [Android only]
    - supported methods: `makeReadOnly`
- bug fix: guard against getCurrentActivity() returns null

v0.5.1
- support `NfcTech.NfcA` [Android only]:
    - representing `android.nfc.tech.NfcA` [link](https://developer.android.com/reference/android/nfc/tech/NfcA)
    - supported methods: `transceive`

v0.5.0
- support `NfcTech.Ndef` [Android only]:
    - representing `android.nfc.tech.Ndef` [link](https://developer.android.com/reference/android/nfc/tech/Ndef)
    - supported methods: `writeNdefMessage`, `getNdefMessage`, `getCachedNdefMessage`
    - please see `examples/AndroidTechTestNdef.js` for a concrete example

v0.4.0
- support `NdefParser.parseText` for RTD_TEXT parsing 

v0.3.2
- change `isSupported` API to utilize `NFCNDEFReaderSession.readingAvailable` [iOS]
- change minSdkVersion to 16 [Android]

v0.3.0
- add `onStateChanged` [Android] 
- add options for `requestNdefWrite` to allow NDEF formating [Android]

v0.2.0
- add `requestNdefWrite` and `cancelNdefWrite` [Android] 

v0.1.0
- add `isNfcSupported` 

## Install
```shell
npm i --save react-native-nfc-manager
```

### Link Native Library with `react-native link`

```shell
react-native link react-native-nfc-manager
```

### Install with cocopods
Include this line inside of your Podfile
```shell
 pod 'react-native-nfc-manager', :path => '../node_modules/react-native-nfc-manager/'
 ```

## Example

Look into `example/App.js` as a starting point.

The easiest way to test is simple make your `AppRegistry` point to our example component, like this:
```javascript
// in your index.ios.js or index.android.js
import React, { Component } from 'react';
import {
  AppRegistry,
} from 'react-native';
import App from 'react-native-nfc-manager/example/App'

AppRegistry.registerComponent('NfcManagerDev', () => App);
```

## API
This library provide a default export `NfcManager` and a named export `NdefParser`, like this:
```javascript
import NfcManager, {NdefParser} from 'react-native-nfc-manager'
```

All methods in `NfcManager` return a `Promise` object and are resolved to different types of data according to individual API.

`NdefParser` is an utility class to parse some well-known NDEF format, currently only support `RTD URI`.

## NfcManager API

### start({onSessionClosedIOS})
Init the module. If the device doesn't support NFC, the returning promise will be rejected.

__Arguments__
- `onSessionClosedIOS` - `function` - [iOS only] the callback to invoke when an `NFCNDEFReaderSession` becomes invalidated

__Examples__
```js
NfcManager.start({
    onSessionClosedIOS: () => {
        console.log('ios session closed');
    }
})
    .then(result => {
        console.log('start OK', result);
    })
    .catch(error => {
        console.warn('device does not support nfc!');
        this.setState({supported: false});
    })
```

### stop()
Terminates the module. This will remove the onSessionClosedIOS listener that is attached in the `start` function.

### isSupported() 
Chck if the NFC is supported by hardware.
Returned `Promise` resolved to a boolean value to indicate whether NFC is supported.

### isEnabled() [Android only]
Check if the NFC is enabled.
Returned `Promise` resolved to a boolean value to indicate whether NFC is enabled.

### goToNfcSetting() [Android only]
Direct the user to NFC setting.

### getLaunchTagEvent() [Android only]
Get the NFC tag object which launches the app.
Returned `Promise` resolved to the NFC tag object launching the app and resolved to null if the app isn't launched by NFC tag.

### registerTagEvent(listener, alertMessage, invalidateAfterFirstRead)
Start to listen to *ANY* NFC tags.

__Arguments__
- `listener` - `function` - the callback when discovering NFC tags
- `alertMessage` - `string` - (iOS) the message to display on iOS when the NFCScanning pops up
- `invalidateAfterFirstRead` - `boolean` - (iOS) when set to true this will not have you prompt to click done after NFC Scan.

__Examples__
```js
NfcManager.registerTagEvent(tag => {
    console.log('Tag Discovered', tag);
}, 'Hold your device over the tag', true)
```

### unregisterTagEvent()
Stop listening to NFC tags.

### requestNdefWrite(bytes, options) [Android only]
Request writing **NdefMessage** (constructed by `bytes` array you passed) into next discovered tag.
Notice you must call `registerTagEvent` first before calling this. 

__Arguments__
- `bytes` - `array` - the full NdefMessage, which is an array of number
- `options` - `object` - optional argument used to trigger actions such as `format` or `formatReadOnly`

__Examples__
```js
// write ndef
NfcManager.requestNdefWrite(bytes)
    .then(() => console.log('write completed'))
    .catch(err => console.warn(err))

// request ndef formating (first argument can be null in this case)
NfcManager.requestNdefWrite(null, {format: true})
    .then(() => console.log('format completed'))
    .catch(err => console.warn(err))
```

### cancelNdefWrite() [Android only]
Cancel the pending ndef writing operation.

### onStateChanged(listener) [Android only]
Listen to NFC state change (on/off/turning_on/turning_off)

__Arguments__
- `listener` - `function` - the callback when NFC state changed

__Examples__
```js
NfcManager.onStateChanged(
    event => {
        if (event.state === 'on') {
            // do whatever you want
        } else if (event.state === 'off') {
            // do whatever you want
        } else if (event.state === 'turning_on') {
            // do whatever you want
        } else if (event.state === 'turning_off') {
            // do whatever you want
        }
    }
)
    .then(sub => {
        this._stateChangedSub = sub; 
        // remember to call this._stateChangedSub.remove()
        // when you don't want to listen to this anymore
    })
    .catch(err => {
        console.warn(err);
    })
```

### requestTechnology(tech) [Android only]
Request specific NFC Technology to perform advanced actions. 
- Please refer to [Android Advanced NFC Guide](https://stuff.mit.edu/afs/sipb/project/android/docs/guide/topics/connectivity/nfc/advanced-nfc.html) to understand what a `NFC Technology` means.

> This method returns a promise:
> * if resolved, it means you already find and connect to the tag supporting the requested technology, so the technology specific API can be called. 
> * if rejected, it means either the request is cancelled or the discovered tag doesn't support the requested technology.

Notice you must call `registerTagEvent` first before calling this. 

__Arguments__
- `tech` - `string` - the NFC Technology you want to use 
    - the available ones are defined in `NfcTech` (please do `import {NfcTech} from 'react-native-nfc-manager`) 

__Examples__
> A concrete example using NFC Technology can be found in `examples/AndroidTechTestNdef.js`

### cancelTechnologyRequest() [Android only]
Cancel previous NFC Technology request. 

### closeTechnology() [Android only]
When all your NFC Technology operations are finished, you should call this API to disconnect from the tag and release resources.

### setNdefPushMessage(bytes) [Android only]
This API triggers [**Android Beam**](https://developer.android.com/guide/topics/connectivity/nfc/nfc#p2p), it can send Ndef (constructed by `bytes` array you passed) to remote device.
Notice you must call `registerTagEvent` first before calling this. 

> When you want to cancel the Ndef sending, simply call this API again and pass `null` to it.

__Arguments__
- `bytes` - `array` - the full NdefMessage, which is an array of number

__Examples__

> Please see `examples/App.js` for a concrete example

```js
// register Android Beam 
NfcManager.setNdefPushMessage(bytes)
    .then(() => console.log('ready to beam'))
    .catch(err => console.warn(err))

// cancel Android Beam
NfcManager.setNdefPushMessage(null)
    .then(() => console.log('beam cancelled'))
    .catch(err => console.warn(err))
```

## NdefParser API

### parseUri(ndef)
Try to parse RTD_URI from a NdefMessage, return an object with an `uri` property.

__Arguments__
- `ndef` - `object` - this object should be obtained from nfc tag object with this form: `tag.ndefMessage[0]`. (NFC tag object can be obtained by `getLaunchTagEvent` or `registerTagEvent`)

__Examples__
```js
let {uri} = NdefParser.parseUri(sampleTag.ndefMessage[0]);
console.log('parseUri: ' + uri);
```

### parseText(ndef)
Try to parse RTD_TEXT from a NdefMessage, return parsed string or null if the operation fail. Currently only support utf8.

__Arguments__
- `ndef` - `object` - this object should be obtained from nfc tag object with this form: `tag.ndefMessage[0]`. (NFC tag object can be obtained by `getLaunchTagEvent` or `registerTagEvent`)

__Examples__
```js
let text = NdefParser.parseText(sampleTag.ndefMessage[0]);
console.log('parsedText: ' + text);
```

## NFC Hardware requirement on Android

By default react-native-nfc-manager is set to not require NFC hardware on Android. This setting will overwrite what ever you put in your main AndroidManifest.xml file during `react-native link` phase.

If you want to change this behavior to only have your app support NFC devices you have to override you app manifest manually.

Current setting is:
```<uses-feature android:name="android.hardware.nfc" android:required="false" />```

If you want to only have your app support NFC devices then you have to change required to true.

