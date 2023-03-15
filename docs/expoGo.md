

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

> Notice: This Config Plugin will ensure the minimum Android SDK version is 31.

#### Props

The plugin provides props for extra customization. Every time you change the props or plugins, you'll need to rebuild (and `prebuild`) the native app. If no extra properties are added, defaults will be used.

- `nfcPermission` (_string | false_): Sets the iOS `NFCReaderUsageDescription` permission message to the `Info.plist`. Setting `false` will skip adding the permission. Defaults to `Allow $(PRODUCT_NAME) to interact with nearby NFC devices` (Info.plist).
- `selectIdentifiers` (_string[]_): Sets the iOS [`com.apple.developer.nfc.readersession.iso7816.select-identifiers`](https://developer.apple.com/documentation/bundleresources/information_property_list/select-identifiers) to a list of supported application IDs (Info.plist).
- `systemCodes` (_string[]_): Sets the iOS [`com.apple.developer.nfc.readersession.felica.systemcodes`](https://developer.apple.com/documentation/bundleresources/information_property_list/systemcodes) to a user provided list of FeliCa™ system codes that the app supports (Info.plist). Each system code must be a discrete value. The wild card value (`0xFF`) isn't allowed.
- `includeNdefEntitlement` (true | false): When explicitly set to false, removes the NDEF entitlement as a workaround to [asset validation invalid entitlement bug](https://stackoverflow.com/questions/58131299/xcode-testflight-validate-error-itms-90778-ndef-is-disallowed).

#### Example

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-nfc-manager",
        {
          "nfcPermission": "Custom permission message",
          "selectIdentifiers": ["A0000002471001"],
          "systemCodes": ["8008"],
          "includeNdefEntitlement": false,
        }
      ]
    ]
  }
}
```
