# Migrating from v3 to v4

v4 is still a prerelease. This guide describes the v4 branch; unpublished branch changes are not automatically included in the current npm beta. Confirm your installed version and its release notes before upgrading.

## Choose the architecture first

| Application | Package line |
| --- | --- |
| Legacy Architecture | Keep v3: `npm install react-native-nfc-manager@3` |
| RN 0.76–0.81 with New Architecture enabled | v4 beta; legacy mode is outside the v4 contract |
| RN 0.82 or newer | New Architecture only; check the exact-version evidence in the support policy |
| RN older than 0.76 | Outside v4 support |

The v4 minimum iOS deployment target is 15.1 and its Swift language baseline is 5.7. Use the toolchain required by your React Native version, including its Android SDK/NDK requirements. A broad peer-dependency range is not evidence that every RN minor was compiled or tested.

## Install and rebuild

Before stable promotion, install the beta channel, then lock the exact resolved version:

```sh
npm install react-native-nfc-manager@beta
```

Run your application's CocoaPods installation on iOS, then rebuild the native application on both platforms. A Metro refresh or JavaScript-only update cannot replace the native module. Review NFC capabilities, provisioning, iOS usage-description/identifier settings, and Android permissions in the [README](../README.md).

Expo applications require prebuild and a custom Development Build. Expo Go cannot load this native module. Follow the [Expo instructions](../README.md#expo-development-builds), rebuild after plugin changes, and distinguish local build verification from hosted EAS verification.

An unqualified install currently selects v3 through `latest`. The release procedure will update this guidance when stable v4 actually becomes `latest`; changing the GitHub default branch does not change npm resolution.

## TypeScript result corrections

The existing native payload is not uniform across tags and platforms. Current v4 declarations include these corrections:

- `TagEvent.ndefMessage` is optional. Use `tag?.ndefMessage ?? []` or check for presence before iterating.
- `NdefRecord.id` can be an Android hexadecimal string or an iOS byte array. Narrow before byte-array operations; do not interpret the hexadecimal string as UTF-8 bytes.
- Technology-specific metadata is optional. Android cached NFC-A, NFC-V, and ISO-DEP fields do not imply a new NFC exchange, and not all have hardware evidence.

```ts
for (const record of tag?.ndefMessage ?? []) {
  if (typeof record.id === 'string') {
    console.log('Android record ID (hex)', record.id);
  } else {
    console.log('Record ID bytes', record.id);
  }
}
```

These declaration corrections can require source changes even where native payloads are unchanged. Consult [CHANGELOG](../CHANGELOG.md) for the release containing each change; some corrections currently remain Unreleased.

## Preserve the asynchronous lifecycle

Await `start()` before requesting a technology. Handle initialization/request/I/O errors, avoid overlapping requests, and await `cancelTechnologyRequest()` in cleanup before allowing the next scan. Follow the [introductory example](../README.md#gettingstarted). Existing cancellation, error, event, and timeout contracts remain applicable; an Android tag-wait timeout is not implied by a transceive timeout.

## Verify the flows your application uses

The [support policy](./SUPPORT_POLICY.md) distinguishes API availability, compiler evidence and device evidence. Recorded basic NDEF and Android NTAG215 flows do not establish coverage for every tag. iOS ISO 15693, configured transceive timeout, and NFC-V/ISO-DEP metadata have outstanding hardware coverage in the current record. Exercise your application's technologies, repeated requests, cancellation, background/resume, and failure recovery on physical devices before rollout.

To stay on v3, keep the `@3` version range and rebuild the application after native dependency changes. Existing lockfiles/ranges do not automatically cross the major-version boundary when npm latest changes.
