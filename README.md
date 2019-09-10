# react-native-nfc-manager

[![npm version](https://img.shields.io/npm/v/react-native-nfc-manager.svg?style=flat)](https://www.npmjs.com/package/react-native-nfc-manager)
[![build](https://api.travis-ci.org/whitedogg13/react-native-nfc-manager.svg?branch=master)](https://travis-ci.org/whitedogg13/react-native-nfc-manager)
[![issues](https://img.shields.io/github/issues/whitedogg13/react-native-nfc-manager.svg?style=flat)](https://github.com/whitedogg13/react-native-nfc-manager/issues)

Bring NFC feature to React Native. Inspired by [phonegap-nfc](https://github.com/chariotsolutions/phonegap-nfc) and [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager)

Contributions are welcome!

## iOS 13 development is ongoing!

Ndef writing, get UID, send mifare command, and APDU exchange... Lots features come into iOS13!

Currently this work will be published in npm beta channel.

## Install

```shell
# RN >= 0.60, XCode 11 (for all fancy iOS 13 core nfc features!)
npm i --save react-native-nfc-manager@beta
```

```shell
# RN >= 0.60, XCode 10
npm i --save react-native-nfc-manager@2.0.0-beta.1
```

```shell
# RN < 0.60, XCode 10
npm i --save react-native-nfc-manager@1.2.2
```

## Setup


```shell
# RN >= 0.60, iOS
cd ios && pod install && cd ..
# ...then open ios/xxx.xcworkspace...
```

```shell
# RN >= 0.60, Android
# This module leverages autolink, so no extra steps are required
```
(see [here](https://github.com/react-native-community/cli/blob/master/docs/autolinking.md#autolinking) for more info about autolink)


```shell
# RN < 0.60, both platforms
react-native link react-native-nfc-manager
```

## Extra iOS setup is required

You will need to setup some capabilities / entitlement / plist stuff to enable NFC development on your device, this repo explains these requirements very well:

* https://github.com/hansemannn/iOS11-NFC-Example 


## Example

Look into `example` for the features you need.

**v2 examples**

[v2-ios+android-read-ndef](example/AppV2.js)
[v2-ios+android-write-ndef](example/AppV2Ndef.js)
[v2-ios+android-get-uid](example/AppV2Mifare.js)
[v2-ios+android-mifare-custom-command](example/AppV2Mifare.js)

**v1 examples**

[v1-ios-read-ndef](example/App.js)
[v1-android-read-write-ndef](example/App.js)
[v1-android-mifare-classic](example/AndroidMifareClassic.js)
[v1-android-read-write-ndef-with-ndef-tech](example/AndroidTechTestNdef.js)

## API Document

[v2 doc](APIv2.md)
[v1 doc](APIv1.md)


