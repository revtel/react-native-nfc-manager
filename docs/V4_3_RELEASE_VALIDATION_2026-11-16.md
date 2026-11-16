---
search: false
---

# 4.3.0 release validation — 2026-11-16

## Scope and artifact

This candidate combines SwiftPM integration ([#862](https://github.com/revtel/react-native-nfc-manager/pull/862))
and the `Ndef.stringify` repair ([#866](https://github.com/revtel/react-native-nfc-manager/pull/866),
fixing [#864](https://github.com/revtel/react-native-nfc-manager/issues/864)).
Release preparation is tracked in [#867](https://github.com/revtel/react-native-nfc-manager/pull/867).

The locally packed 4.3.0 candidate has SHA-256
`ee5d1aa3bf6ae0aef69601b380d7f90f8206b7a2ba360b8a924105798de6b1f7`.
All 117 installed package files matched this artifact byte-for-byte after
React Native's SwiftPM update. Documentation outside the npm package can be
updated without changing the artifact; final publication still requires an
independent registry artifact comparison.

## Completed JavaScript/package verification

- `npm run verify`: build, lint, public types, 213 library tests, 56 mocked
  example tests and 117-file package verification passed.
- `npm run verify:codegen`: Android and iOS schema/generation passed on
  React Native 0.76.9, 0.77.3 and 0.84.0.
- `npm run test:publishing`: all 18 controller regression tests passed.
- The seven stringify regression cases also passed against the installed
  tarball's compiled CommonJS output, not only repository TypeScript.

## SwiftPM candidate verification

The installed candidate was used in the existing isolated RN 0.88.1 official
CLI-template fixture, with Node 22.22.2 and Xcode 27.2. `react-native spm update`
passed using local React Native XCFramework artifacts. Clean DerivedData builds
of Debug and Release both passed for arm64 and x86_64 iOS Simulator destinations.

The Release app ran its embedded JavaScript bundle on a fresh iPhone 17 Pro / iOS
26.5 simulator. Synthetic background activity produced one native notification,
ignored an unrelated activity, and returned the expected URI bytes through
`getBackgroundTag()`. The result screen showed `NFC_BACKGROUND_CACHE_SMOKE: PASS`
and `isSupported() === false`, as expected on a simulator. This verifies linking
and native-to-JavaScript delivery, not an OS-delivered NFC event or physical NFC.

Initial restricted execution could not access CoreSimulator/SwiftPM sandbox
services; the standard authorized native-build execution succeeded without
changing candidate code.

## Native and publication gates

- RN 0.76.9 packed support-floor consumer: Android APK, CocoaPods installation,
  documented Xcode/fmt compatibility adjustment, and dual-architecture unsigned
  iOS Simulator application build all passed. Its packed candidate SHA-256 is
  identical to the artifact above. Node 22.22.2, Java 17, Ruby 3.1.2,
  CocoaPods 1.15.2 and ffi 1.17.0 were used.
- Hosted PR CI passed Validate, Android New Architecture, iOS New Architecture,
  Select native builds and Native build gate; documentation also built.
- Expo consumer generation, tarball installation and prebuild passed. **Expo
  Doctor failed 20/21**: the validation fixture pins Expo 57.0.31, while the SDK
  now requires `~57.0.33`. This is an additional failure disallowed by the release
  policy. Expo Android/iOS compilation was not run.

**Publication is blocked.** PR #867 remains a draft; no release merge, tag or
npm publication occurred. The next step is to update the verification fixture's
Expo patch pin and corresponding tests, rerun Expo gates, then complete exact-main
CI and the publication preview. Do not treat the native checks above as passing
Expo or the final publication gate.

## Risk assessment and hardware limits

Relative to published 4.2.0 (`f7c51990aded9b9bf98c6fc5a1401efef5bc900f`),
Android runtime, native session/read/write/transceive logic, the public Codegen
specification and Expo plugin are unchanged. iOS callback typedefs are moved
unchanged into a shared header; new SwiftPM targets and module maps change
integration/linking. The JavaScript change fixes record formatting/decoding,
covered by source and packed-output regression tests.

Historical device evidence remains attributed to the original artifacts in the
[4.2.0 validation](./V4_2_RELEASE_VALIDATION_2026-10-27.md) and linked records.
It is reused for unchanged NFC operations, not relabeled as 4.3.0 hardware
verification. Focused candidate checks target SwiftPM compilation/linking,
simulator native-module behavior and existing CocoaPods/Expo compilation.
No new physical-device/tag reading, writing, authentication or OS-delivered
background NFC event test is claimed. Hosted EAS/App Store and optional remote
React Native SwiftPM artifact mode remain unverified.
