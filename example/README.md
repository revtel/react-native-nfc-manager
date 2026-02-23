# react-native-nfc-manager RN CLI Example

This app is the primary development example for `react-native-nfc-manager`.
It validates the local library integration and core NFC flows on native iOS/Android.

## What this example validates

- Local package integration via `"react-native-nfc-manager": "file:.."`
- Basic NFC smoke flows in `App.tsx`
	- `start()`
	- `isSupported()` / `isEnabled()`
	- `requestTechnology()` + `getTag()`
	- `cancelTechnologyRequest()`
- New Architecture boot commands (`react-native@0.84`)

## Setup

From repository root:

```sh
cd example
npm install
```

For iOS:

```sh
cd ios
bundle install
bundle exec pod install
cd ..
```

## Run

Start Metro:

```sh
npm start
```

In another terminal:

```sh
# Android
npm run android

# iOS
npm run ios
```

## Architecture notes

- This example uses `react-native@0.84`, which is New Architecture only.
- Old Architecture toggles (`newArchEnabled=false`, `RCT_NEW_ARCH_ENABLED=0`) are not supported in this RN version.

## Commands

Android:

```sh
npm run android
```

iOS:

```sh
npm run pods && npm run ios
```

## Notes

- NFC requires physical hardware and native capabilities/permissions.
- iOS simulator does not provide real NFC behavior.
- Support policy and matrix are defined in `../docs/SUPPORT_POLICY.md`.

## Troubleshooting

### `bundle install` fails on `ffi`

If you see errors similar to:

- `An error occurred while installing ffi (...)`
- `archive member '/' not a mach-o file`

It is usually caused by incompatible `ar/ranlib` toolchain binaries in `PATH` (for example Homebrew `binutils` taking precedence), combined with source build of `ffi`.

Use:

```sh
bundle config unset --local force_ruby_platform
AR=/usr/bin/ar RANLIB=/usr/bin/ranlib bundle install
```

Then run:

```sh
npm run pods
```

### iOS shows `Not support in this device` on physical device

If you are testing on a real iPhone but still see `Not support in this device`, verify all of the following:

1. Xcode target has NFC capability enabled:
	- `Signing & Capabilities` includes `Near Field Communication Tag Reading`
2. App has NFC usage description in `Info.plist`:
	- `NFCReaderUsageDescription`
3. Entitlement is attached and contains NFC formats:
	- `com.apple.developer.nfc.readersession.formats` with `NDEF` and `TAG`
4. Your Apple Developer App ID/profile supports NFC Tag Reading for this bundle identifier.

After changing capabilities/profile, clean and reinstall:

```sh
npm run pods
npm run ios
```
