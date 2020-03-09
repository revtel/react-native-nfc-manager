# react-native-nfc-manager

[![npm version](https://img.shields.io/npm/v/react-native-nfc-manager.svg?style=flat)](https://www.npmjs.com/package/react-native-nfc-manager)
[![build](https://api.travis-ci.org/whitedogg13/react-native-nfc-manager.svg?branch=master)](https://travis-ci.org/whitedogg13/react-native-nfc-manager)
[![issues](https://img.shields.io/github/issues/whitedogg13/react-native-nfc-manager.svg?style=flat)](https://github.com/whitedogg13/react-native-nfc-manager/issues)

Bring NFC feature to React Native. Inspired by [phonegap-nfc](https://github.com/chariotsolutions/phonegap-nfc) and [react-native-ble-manager](https://github.com/innoveit/react-native-ble-manager)

Contributions are welcome!

## Install

```shell
# RN >= 0.60
npm i --save react-native-nfc-manager
```

```shell
# RN < 0.60 (without the latest iOS 13 feature)
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

**IMPORTANT: For the new NFC capabilities available on iOS 13 to work, the entitlements file mentioned in the previous guide should look like this:**

```xml
<key>com.apple.developer.nfc.readersession.formats</key>
<array>
  <string>NDEF</string>
  <string>TAG</string>
</array>
```

## Launch app on nfc event

Note on getLaunchTagEvent: keep in mind that you can only create intent-filters for the very first NDEF record on an NFC tag! If your intent-filter doesn't match the FIRST record your app will launch but it won't get the tag data. Check out for details: 
https://stackoverflow.com/questions/25504418/get-nfc-tag-with-ndef-android-application-record-aar/25510642

Also you should add 
```xml
android:launchMode="singleTask"
```
to your manifest to prevent launching your app as another task when it is already running.

## Demo project

Please use [this repo](https://github.com/whitedogg13/nfc-test-app) as a quick start.

## Example codes

Look into `example` for the features you need.

**v2 examples**

* [v2-ios+android-read-ndef](example/AppV2.js)
* [v2-ios+android-write-ndef](example/AppV2Ndef.js)
* [v2-ios+android-get-uid](example/AppV2Mifare.js)
* [v2-ios+android-mifare-custom-command](example/AppV2Mifare.js)

**v1 examples**

* [v1-ios-read-ndef](example/App.js)
* [v1-android-read-write-ndef](example/App.js)
* [v1-android-mifare-classic](example/AndroidMifareClassic.js)
* [v1-android-read-write-ndef-with-ndef-tech](example/AndroidTechTestNdef.js)

## API Document

* [v2 doc](APIv2.md)
* [v1 doc](APIv1.md)


