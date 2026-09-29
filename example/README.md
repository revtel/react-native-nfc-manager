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
npm ci
npm run build
cd example
npm ci
```

Use Node.js 22 (22.11 or later) and Java 17 for Android. Install the SDK/NDK versions from `android/build.gradle`. The root build above creates `dist/src/index.js`, required by the local `file:..` dependency. Repeat `npm run build` from the root after changing library TypeScript.

For iOS, select Ruby 3.1.2 through rbenv and Bundler 2.3.7:

```sh
RBENV_VERSION=3.1.2 rbenv exec bundle _2.3.7_ install
cd ios
RBENV_VERSION=3.1.2 rbenv exec bundle _2.3.7_ exec pod install
cd ..
```

## Run

Start Metro:

```sh
npm start
```

In another terminal, from `example/`:

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
rbenv exec bundle config unset --local force_ruby_platform
AR=/usr/bin/ar RANLIB=/usr/bin/ranlib rbenv exec bundle install
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
