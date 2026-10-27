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

## Tag information without an NDEF read

After rebuilding the native app, use **NFC-A Tag Info Without NDEF Read** with
a MIFARE/NTAG Type 2 tag. The action connects using `MifareIOS` on iOS or `NfcA`
on Android, calls `getTag({readNdef: false})` twice, logs both results, and awaits
cleanup. iOS results should contain available metadata without `ndefMessage`.
On Android the action also configures reader mode to skip discovery-time NDEF
checks; that separate flag is not supplied by `getTag` itself.

This action does not authenticate or change the tag. Remove the tag and repeat
the action to check recovery, then use **Request Ndef + Get Tag** with an ordinary
NDEF tag to check the existing read flow. Protected-tag authentication and data
commands depend on the tag; metadata success alone does not verify authentication.

For a password-protected **NTAG215**, enter its known four-byte password as eight
hexadecimal characters in the secure field on the device, then use **NTAG215
Authenticate + Read (No Writes)**. The action gets metadata twice with
`readNdef: false`, sends one password-authentication command, reads pages 4–7,
and awaits cleanup. It does not write data or change protection settings. Only
use the correct known password; an incorrect password can count toward the tag's
configured authentication-attempt limit. The field clears when the operation ends.
Logs omit the password, authentication response, and page contents. A successful
read covers pages 4–7 only; record separately whether those pages are protected.

## Architecture notes

- This example uses `react-native@0.84`, which is New Architecture only.
- Old Architecture toggles (`newArchEnabled=false`, `RCT_NEW_ARCH_ENABLED=0`) are not supported in this RN version.
- The iOS example uses a single UIKit scene, including when built with the iOS
  27 SDK. React Native starts from `SceneDelegate` after its window is connected.
- Metro resolves React and React Native from this app's dependencies even for
  the linked library, avoiding a second runtime from the repository's dev dependencies.

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

## Android same-session NDEF write/read smoke test

For PR #843's writable-tag regression, use **NDEF Write + Live Read
(Overwrites Tag)** with a disposable writable NDEF tag. Keep it still until
both `PASS same-session` messages and `cleanup completed` appear. This writes
two distinct timestamped text records, each followed by a live
`getNdefMessage()` read without reconnecting. Preflight uses cached discovery
metadata rather than a live read before writing an empty tag. The app logs the original data,
tag ID, writable status, capacity, and readback records under `[NDEF843]`.
Remove the tag, press **NDEF Verify After Removing Tag**, then scan the same
tag again and require `PASS saved content`. Repeat the cycle to verify cleanup.
The final test text remains on the tag. Record device/OS, tag technology,
commit, logs, and observed results; mocked tests do not establish hardware success.

## Android cached metadata smoke test

Use the current built package on a physical Android device. These actions read
cached tag metadata; they do not send transceive commands or write a tag.

1. Press **Start Metadata Discovery (Read Only)**, scan an NFC-V or ISO-DEP card,
   and record the `discoverTag` fields. Press **Stop Metadata Discovery**.
2. Remove the card. Press **Read NFC-V Metadata (Read Only)** or
   **Read ISO-DEP Metadata (Read Only)**, then tap the same card. The app prints
   selected `getTag()` metadata and cancels the request automatically.
3. Remove the card and repeat to check cleanup and subsequent requests.

For NFC-V record `dsfid` and `responseFlags` (unsigned numbers). For ISO-DEP
record `historicalBytes` for NFC-A or `hiLayerResponse` for NFC-B. Either field
can be absent depending on the card; do not treat every missing optional field
as a failure. Record device/OS, package commit, card technology, discovery and
getTag values, repeated-request results and any errors before marking a hardware
gate complete. NFC-V or ISO-DEP support alone does not establish that a card is
a writable NDEF tag for PR #843's same-session write/read regression.
