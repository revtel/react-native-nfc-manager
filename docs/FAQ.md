# FAQ

## [iOS] cannot write NDEF into NFC tags

iOS won't allow writing NDEF into un-formatted tags, so you should first format your tags. For type 2 tags (most NTAG2xx), you can use an app like NFC Tools or NXP Tag Writer to do perform formatting.

> It's possible to implement the NDEF formatting ourself through this library, here's an [example](https://github.com/revtel/react-native-nfc-rewriter/tree/naive-ndef-format). However, it's actually an naive approach, since we don't handle the case if the tag is already formatted and we provide no extra lock / memory information before NDEF TLV, so use this code snippet with cautions.

## [iOS] cannot read NDEF from NFC tags

The same as above, please check if the tag is properly formatted, and contain at least 1 NdefMessage 
* This NdefMessage can contain only one NdefRecord as [TNF_EMPTY](https://developer.android.com/reference/android/nfc/NdefRecord#TNF_EMPTY)

## [iOS] cannot read / write Mifare Classic

Indeed, currently MifareClassic isn't supported by Core NFC in our tests. It is also not listed in Core NFC's [NFCMiFareFamily](https://developer.apple.com/documentation/corenfc/nfcmifarefamily?language=objc)

## [Android] My NFC tag cannot launch my app

Note on getLaunchTagEvent: keep in mind that you can only create intent-filters for the very first NDEF record on an NFC tag! If your intent-filter doesn't match the FIRST record your app will launch but it won't get the tag data. Check out for details: 
https://stackoverflow.com/questions/25504418/get-nfc-tag-with-ndef-android-application-record-aar/25510642

Also you should add 
```xml
android:launchMode="singleTask"
```
to your manifest to prevent launching your app as another task when it is already running.

