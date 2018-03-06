# react-native-nfc-manager

Bring NFC feature to React Native. Inspired by [phonegap-nfc](https://github.com/chariotsolutions/phonegap-nfc) and [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager)

Contributions are welcomed!

## Supported Platforms
- Android (API 10+)
- iOS (iOS11 with iPhone 7/7+, 8/8+, 10)

## Some Words about iOS Support

You will need to setup some capabilities / entitlement / plist stuff to enable NFC development on your device, please follow this great tutorial:
* https://www.youtube.com/watch?v=SD6Rm4cGyko

## Version history (from v0.1.0) 

v0.1.0
- add `isNfcSupported` 

v0.2.0
- add `requestNdefWrite` and `cancelNdefWrite` [Android only] 

v0.3.0
- add `onStateChanged` [Android only] 

## Install
```shell
npm i --save react-native-nfc-manager
```

### Link Native Library with `react-native link`

```shell
react-native link react-native-nfc-manager
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

### requestNdefWrite(bytes) [Android only]
Request writing **NdefMessage** (constructed by `bytes` array you passed) into next discovered tag.
Notice you must call `registerTagEvent` first before calling this. 

__Arguments__
- `bytes` - `array` - the full NdefMessage, which is an array of number

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

## NdefParser API

### parseUri(ndef)
Try to parse uri from a NdefMessage, return an object with an `uri` property.

__Arguments__
- `ndef` - `object` - this object should be obtained from nfc tag object with this form: `tag.ndefMessage[0]`. (NFC tag object can be obtained by `getLaunchTagEvent` or `registerTagEvent`)

__Examples__
```js
let {uri} = NdefParser.parseUri(sampleTag.ndefMessage[0]);
console.log('parseUri: ' + uri);
```

## NFC Hardware requirement on Android

By default react-native-nfc-manager is set to not require NFC hardware on Android. This setting will overwrite what ever you put in your main AndroidManifest.xml file during `react-native link` phase.

If you want to change this behavior to only have your app support NFC devices you have to override you app manifest manually.

Current setting is:
```<uses-feature android:name="android.hardware.nfc" android:required="false" />```

If you want to only have your app support NFC devices then you have to change required to true.

