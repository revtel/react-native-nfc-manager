# Expo 57.0.25 validation record — 2026-09-29

The clean packed-package Expo consumer gate and basic iPhone/Android regressions
passed. Earlier, broader device smoke flows are recorded separately in
[the Expo 57.0.21 smoke record](./EXPO_SMOKE_2026-09-29.md).

## Candidate and environment

- Package: `react-native-nfc-manager` **4.0.0-beta.9**, packed on `v4-refactor`
  at `58bf62f`, with the uncommitted Expo pin update. This is a local candidate,
  not the published npm artifact.
- Expo **57.0.25**, React Native **0.86.3**, New Architecture.
- Tarball SHA-256:
  `d18b7437b2bf5a1a82de3337e013d9dd456eb3fbdc5052c8aed81d8fc1094aaf`.
- Node **22.22.2**, Java **17.0.12**, rbenv Ruby **3.1.2**, Bundler **2.3.7**,
  CocoaPods **1.15.2**.
- Command: `npm run verify:expo -- --keep-temp`.
- Preserved validator consumer:
  `/var/folders/zy/g8k5wv5d1fg8n6g3s0t50d9r0000gn/T/rn-nfc-expo-UoLShV/NfcExpoConsumer`.
- Local validation log: `/private/tmp/nfc-expo-57.0.25-validation.log`.

## Results

| Check | Result |
| --- | --- |
| Clean generation, install, prebuild | Pass |
| Generated NFC configuration | Pass |
| Packed dependency provenance and autolinking | Pass |
| Expo Doctor review | Pass under the documented exception: only the React Native Directory New Architecture metadata warning remained. The Expo patch mismatch was resolved. |
| Android arm64 New Architecture Debug APK | Pass |
| iOS Pods and Codegen | Pass |
| Unsigned iOS Simulator application | Pass |
| Root build, lint, public typecheck | Pass |
| Root Jest | 76 tests passed after sequential validation. An initial concurrent build/test run temporarily removed `dist` and failed module resolution. |
| Development Build smoke consumer TypeScript | Pass |
| Development Build Android arm64 Debug APK | Pass |
| Development Build iOS Pods and signed iPhone Debug application | Pass |

## Physical-device regression

`npm run prepare:expo:smoke` generated a separate Development Build consumer
using the same tarball SHA-256:
`/var/folders/zy/g8k5wv5d1fg8n6g3s0t50d9r0000gn/T/rn-nfc-expo-smoke-icK6kC/NfcExpoConsumer`.

The iPhone 15 Plus / iOS 26.6.1 Development Build was installed and launched over
Wi-Fi; Metro bundled the iOS app successfully. The user reported all instructed
basic regression steps normal:

| iPhone flow | Result |
| --- | --- |
| Start / support / enabled checks | Pass |
| NDEF read and cleanup | Pass |
| Cancel pending NDEF without scanning | Pass |
| NDEF read again after cancellation and cleanup | Pass |

The regression tag model was not recorded. One-shot events, full session timeout,
and background/resume were tested on 57.0.21 but not repeated on 57.0.25 yet.

The initial Android installation stalled with a committed session still active.
At the user's request, `adb uninstall` removed the previous test app successfully.
The abandoned older session was removed, while another committed installation
ignored abandonment after relinquishing control. A fresh non-streaming install
again stalled at progress 0.9. Its log reports verification timeout followed by
continuing installation; no successful installation result or system confirmation
dialog was observed during that attempt.

After the user restarted the Samsung SM-N975U1 / Android 12, wireless ADB at
`192.168.68.115:45647` reconnected. Non-streaming installation succeeded, the app
launched, and Metro bundled successfully. The APK SHA-256 was
`ba2abf2442862f4ec957f6c3ed6398d9099a7002e77c04f38aa3322071044e3a`.
The device screen directly showed `start() success`, `isSupported(Ndef): true`,
and `isEnabled(): true`. The user confirmed all instructed NTAG215 regression
steps succeeded, including cleanup and scan-prompt closure:

| Android flow | Result |
| --- | --- |
| Start / support / enabled checks | Pass; directly observed |
| NTAG215 NDEF read and cleanup | Pass; user reported |
| Cancel pending NDEF after 2.5 seconds without scanning | Pass; user reported |
| NTAG215 NDEF read again after cancellation | Pass; user reported |
| NTAG215 NfcA transceive and cleanup | Pass; user reported |
| Scan prompt closes and returns to ready after each operation | Pass; user reported |

Raw tag payloads and NfcA response bytes were not retained. One-shot events,
manual/back-button cancellation, and background/resume were not repeated on
57.0.25. Android I/O timeout/tag removal, iOS ISO 15693, and individually asserted
cached Android metadata remain unverified by these regressions.

Compiler and launch success do not verify physical NFC behavior or hosted EAS
Build. This record does not establish all stable-promotion gates.
