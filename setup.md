## iOS

1. In [apple developer site](https://developer.apple.com/), enable capability for NFC

![enable capability](./images/enable-capability.png "enable capability")

2. in Xcode, add `NFCReaderUsageDescription` into your `info.plist`, for example:

```
<key>NFCReaderUsageDescription</key>
<string>We need to use NFC</string>
```

More info on Apple's [doc](https://developer.apple.com/documentation/bundleresources/information_property_list/nfcreaderusagedescription?language=objc)

Additionally, if writing ISO7816 tags add application identifiers (aid) into your `info.plist` as needed like this.
```
<key>com.apple.developer.nfc.readersession.iso7816.select-identifiers</key>
<array>
  <string>D2760000850100</string>
  <string>D2760000850101</string>
</array>
```

More info on Apple's [doc](https://developer.apple.com/documentation/corenfc/nfciso7816tag)

An incomplete list of aid's can be found here. [Application identifier](https://www.eftlab.com/knowledge-base/211-emv-aid-rid-pix/)

3. in Xcode's `Signing & Capabilities` tab, make sure `Near Field Communication Tag Reading` capability had been added, like this:

![xcode-add-capability](./images/xcode-capability.png "xcode capability")

If this is the first time you toggle the capabilities, the Xcode will generate a `<your-project>.entitlement` file for you:

![xcode-add-entitlement](./images/xcode-entitlement.png "xcode entitlement")

4. in Xcode, review the generated entitlement. It should look like this:

![edit entitlement](./images/edit-entitlement.png "edit entitlement")

More info on Apple's [doc](https://developer.apple.com/documentation/bundleresources/entitlements/com_apple_developer_nfc_readersession_formats?language=objc)

## Android

Simple add `uses-permission` into your `AndroidManifest.xml`:

```xml
 <uses-permission android:name="android.permission.NFC" />
```
