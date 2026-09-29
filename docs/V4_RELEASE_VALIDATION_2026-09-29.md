# v4 stable-promotion validation checkpoint — 2026-09-29

This records validation of the current beta.9 code before preparing a stable
release. It does not announce 4.0.0, establish validation of an eventual stable
tarball, or authorize publishing.

All automated checks below and the recorded Android physical-device failed-I/O
recovery passed. Stable version preparation remains a separate step.

## Candidate

- Branch: `v4-refactor`.
- Commit: `e1a639bac50b67b152eeb6d7ee8803c9b4ef663d`.
- Package: `react-native-nfc-manager` **4.0.0-beta.9**.
- Packed library SHA-256:
  `d18b7437b2bf5a1a82de3337e013d9dd456eb3fbdc5052c8aed81d8fc1094aaf`.
- The clean RN 0.76 consumer uses the same packed library content as
  [the verified Expo 57.0.25 consumer](./EXPO_VALIDATION_2026-09-29.md).
- A file-by-file SHA-256 comparison of all 107 packed files against the original
  Expo 57.0.21 smoke tarball
  (`39b0dbcaaa60e4739ca3f31b05c4797bbe630e5f79b1e6a2dd0540e64fe3c8ce`)
  found only `README.md` changed. Library runtime, native sources, plugin,
  declarations, and package metadata were identical. The Expo consumer patch
  itself changed separately; broader 57.0.21 device flows are not relabeled as
  57.0.25 consumer tests.
- Node 22.22.2, Java 17.0.12, Ruby 3.1.2 through rbenv, Bundler 2.3.7,
  CocoaPods 1.15.2, Xcode 27.0 (27A266a).
- `pod install` refreshed the primary example's lockfile from library beta.7 to
  beta.9 and updated its podspec checksum. That generated change is included
  with this checkpoint; other Pod versions were unchanged.

## Automated checks

| Check | Command | Result |
| --- | --- | --- |
| TypeScript build | `npm run build` | Pass |
| Lint | `npm run lint` | Pass |
| Public typecheck | `npm run typecheck` | Pass |
| Root mocked tests | `npm test -- --runInBand --no-watchman` | 76 passed |
| Example mocked tests | `cd example && npm test -- --runInBand --no-watchman` | 12 passed |
| Packed package contents | `npm run verify:package` | Pass; 107 files checked |
| RN 0.76.9 / 0.77.3 / 0.84.0 Codegen, Android and iOS | `npm run verify:codegen` | All three entries passed |
| RN 0.84 Android New Architecture application | `cd example/android && ./gradlew :app:assembleDebug --no-daemon` | Pass |
| RN 0.84 iOS Pods | `cd example/ios && rbenv exec bundle exec pod install` | Pass |
| RN 0.84 iOS Simulator application | AGENTS.md unsigned Simulator `xcodebuild` command | Pass |
| RN 0.76.9 clean native consumer, Android | Support-floor validator, with the cache-seeding driver described below | Pass; arm64 Debug APK produced |
| RN 0.76.9 clean native consumer, iOS | Same validator run | Pass; Pods, Codegen, unsigned Simulator app produced |

The first Codegen attempt hit a sandbox npm-cache write error during packing.
The complete successful rerun used an isolated npm cache and dependency-download
permissions; the validation phases were not skipped.

The first `npm run verify:native:support-floor -- --keep-temp` attempt was stopped
while downloading Gradle 8.10.2 because that exact distribution already existed
locally and the isolated-cache download was slow. A full fresh-consumer rerun
uses `/private/tmp/nfc-v4-e1a639b-support-floor-cached.js`. The temporary driver
calls the unmodified `runSupportFloor` implementation and seeds only the matching
Gradle 8.10.2 wrapper distribution into its isolated cache before Gradle runs.
Package generation, dependency installation, provenance, autolinking, Pods,
Codegen, and application artifact checks remain enabled.
The full rerun passed for both platforms. On Xcode 27, the validator applied its
documented `fmt` consteval adjustment inside the disposable consumer's Pods.
The library source was not patched. The NFC Swift sources retained existing
CoreNFC deprecation warnings; no NFC TurboModule conformance warning was found.

Local logs are under `/private/tmp/`:

- `nfc-v4-e1a639b-codegen.log`
- `nfc-v4-e1a639b-rn84-android.log`
- `nfc-v4-e1a639b-rn84-pods.log`
- `nfc-v4-e1a639b-rn84-ios.log`
- `nfc-v4-e1a639b-support-floor.log`
- `nfc-v4-e1a639b-support-floor-cached.log`

The current RN 0.76 consumer root is
`/var/folders/zy/g8k5wv5d1fg8n6g3s0t50d9r0000gn/T/rn-nfc-native-floor-igtpga`.
The stopped attempt remains preserved at the sibling
`rn-nfc-native-floor-yDrpjM` directory.

Verified artifacts in the current consumer:

- `NfcSupportFloor/android/app/build/outputs/apk/debug/app-debug.apk`
- `ios-derived-data/Build/Products/Debug-iphonesimulator/NfcSupportFloor.app`

## Physical-device failure recovery

The RN 0.84 primary example APK was installed on Samsung SM-N975U1 / Android 12
over wireless ADB. The app loaded through a loopback Metro server forwarded over
Wi-Fi ADB; `start()` succeeded on screen. The user confirmed the instructed
`Test Failed NfcA I/O + Recovery` flow succeeded with NTAG215. The completed
screen was also directly inspected:

| Observed step | Result |
| --- | --- |
| NfcA connects and sends malformed `transceive([0x30])` | 10:05:09 |
| Native I/O rejects | 10:05:10; `malformed transceive rejected: transceive fail` |
| Failed-I/O cleanup | 10:05:13; `failed-I/O cleanup success` |
| Subsequent NDEF request connects | 10:05:20; `failed-I/O recovery connected` |
| Subsequent `getTag()` succeeds | 10:05:20; NDEF record and NFC Forum Type 2 tag returned |
| Cached NFC-A metadata appears in the payload | `atqa: [68, 0]`, `sak: 0` |
| Final cancellation/cleanup and prompt closure | 10:05:32; `cancelTechnologyRequest() success`, prompt absent |

Local screenshot: `/private/tmp/nfc-rn84-android-failed-io-success.png`.
This is a malformed-command failure/recovery test; a specifically configured
transceive timeout or physical tag removal during I/O was not separately tested.
NFC-V and ISO-DEP metadata remain unverified on hardware.

## Remaining promotion work

- Keep iOS ISO 15693 explicitly unverified unless suitable hardware is available.
- Prepare and review the stable version, changelog, support claims, and npm
  dist-tag; validate the final stable packed artifact before publication.
- Coordinate React Native Directory metadata with v4 becoming the default stable
  line. The documented metadata warning is currently accepted.

Compiler success and mocked tests do not establish NFC hardware behavior.
No tag, push, GitHub release, npm publication, or release command was performed.
