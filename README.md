# react-native-nfc-manager

Bring NFC feature to React Native. Inspired by [phonegap-nfc](https://github.com/chariotsolutions/phonegap-nfc) and [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager)

## Supported Platforms
- Android (API 10+)

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

## API
All methods in `NfcManager` return a `Promise` object and are resolved to different types of data according to individual API.

### start()
Init the module.

### isEnabled()
Check if the NFC is enabled.
Returned `Promise` resolved to a boolean value to indicate whether NFC is enabled.

### goToNfcSetting()
Direct the user to NFC setting.

### getLaunchTagEvent()
Get the NFC tag object which launches the app.
Returned `Promise` resolved to the NFC tag object launching the app and resolved to null if the app isn't launched by NFC tag.

### registerTagEvent(listener)
Start to listen to *ANY* NFC tags.

__Arguments__
- `listener` - `function` - the callback when discovering NFC tags

__Examples__
```js
NfcManager.registerTagEvent( tag => {
    console.log('Tag Discovered', tag);
})
```

## unregisterTagEvent()
Stop listening to NFC tags.