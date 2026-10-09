# Expo Development Builds

Install the package with `npm install react-native-nfc-manager`.

`react-native-nfc-manager` contains native code, so it does **not** work in Expo Go. Use an [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) generated locally or by EAS.

Install the package and add its config plugin to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-nfc-manager",
        {
          "nfcPermission": "Allow this app to scan nearby NFC tags"
        }
      ]
    ]
  }
}
```

- `nfcPermission` sets the iOS `NFCReaderUsageDescription` and enables the Android NFC permission. Omit it to use the default description.
- `nfcPermission: false` is an advanced opt-out: it omits the iOS usage description and blocks the Android permission contributed by the library manifest. NFC cannot be used until the application supplies equivalent native configuration itself.
- `includeNdefEntitlement` defaults to `true`; set it to `false` to add only the iOS `TAG` reader-session format. This does not remove NDEF already supplied by other configuration; see the entitlement troubleshooting guide.
- `selectIdentifiers` supplies iOS ISO 7816 application identifiers required by your target cards; these are application-specific.
- `systemCodes` supplies iOS FeliCa system codes required by your target cards.

Install the development client, then generate and build the native application:

```shell
npx expo install expo-dev-client
npx expo prebuild
npx expo run:ios --device
# or
npx expo run:android --device
npx expo start --dev-client
```

Rebuild the native app after changing native dependencies or plugin options; a Metro refresh cannot apply those changes. Use an NFC-capable physical device to test scans. On iOS, your App ID and provisioning must permit NFC.

For dependency, rebuild or entitlement problems, see [Expo troubleshooting](../EXPO_TROUBLESHOOTING.md). Supported versions and recorded validation are in the [support policy](../SUPPORT_POLICY.md).
