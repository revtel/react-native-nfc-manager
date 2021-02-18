## iOS

1. In [apple developer site](https://developer.apple.com/), enable capability for NFC

![enable capability](./images/enable-capability.png "enable capability")

2. in Xcode, add `NFCReaderUsageDescription` into your `info.plist`, for example:

```
<key>NFCReaderUsageDescription</key>
<string>We need to use NFC</string>
```

More info on Apple's [doc](https://developer.apple.com/documentation/bundleresources/information_property_list/nfcreaderusagedescription?language=objc)

3. (optional, if using specific NFC technology) in Xcode, edit entitlement for your need, for example:

![edit entitlement](./images/edit-entitlement.png "edit entitlement")

More info on Apple's [doc](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_nfc_readersession_formats?language=objc)

## Android

Simple add `uses-permission` into your `AndroidManifest.xml`:

```xml
 <uses-permission android:name="android.permission.NFC" />
```

