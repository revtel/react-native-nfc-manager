---
search: false
---

# v4 stable candidate review — 2026-10-09

This is an **unpublished 4.0.0 candidate**, prepared locally on main at `02c0280734da7ee1bebef976df596a47bae367de` with uncommitted package/lock version, example parent/Pod metadata, Expo fixture patch and changelog edits. No stable publication, release tag, commit, push or Pages deployment is recorded by this review. Installation guidance still selects the available beta until publication.

## Candidate identity

- Retained package: `/private/tmp/nfc-stable-candidate/react-native-nfc-manager-4.0.0.tgz`.
- SHA-256: `3b69ccf480b1517129d4dd8e2a56eecdb3f14dbdebd259ba85bdee908d938597`.
- Final repack matched the retained tarball byte-for-byte after documentation and fixture updates.
- Packed files: 110. Library dependency versions, NFC implementation, declarations, Codegen spec and Expo plugin unchanged by candidate preparation.
- Toolchain: Node 22.22.2, Java 17.0.12, rbenv Ruby 3.1.2, CocoaPods 1.15.2, Xcode 27.0 (27A266a).

## Automated/compiler checks

| Check | Result |
| --- | --- |
| Build, lint, public typecheck | Pass |
| Root/example mocked tests | 196 root / 15 example tests pass; no NFC hardware claim |
| Package contents | Pass; 110 files; final repack identical to tested tarball |
| Documentation build / OpenSpec / diff whitespace | Pass |
| Publishing policy/recovery tests | 18 pass, stubbed npm/GitHub operations |
| Packed Codegen, RN 0.76.9 / 0.77.3 / 0.84.0 | Both platforms pass |
| RN 0.76.9 packed Android/iOS application consumer | Pass: Android arm64 APK and complete arm64 iOS Simulator App; Xcode 27 fmt workaround in disposable Pods |
| Expo 57.0.27 / RN 0.86.3 packed consumer | Pass: prebuild/Doctor/NFC configuration/provenance/autolinking, Android APK and complete arm64 iOS Simulator App; no new device test |
| RN 0.84 full hosted application CI | [Main baseline run](https://github.com/revtel/react-native-nfc-manager/actions/runs/37898537651) passed before the 4.0.0 version edit; exact committed stable-candidate CI remains required |

The RN support-floor and Expo validators consume a copy of the retained tarball via their existing `packLibrary` dependency hook. All real generator, dependency, configuration, autolinking, compiler and artifact checks remain enabled; no native execution is mocked. The temporary driver is `/private/tmp/nfc-stable-candidate/run-consumer.cjs`. The original support-floor Gradle download was interrupted because it was slow; an initial cache-resume driver did not match the absolute gradlew path and was stopped during configuration. The corrected `/private/tmp/nfc-stable-candidate/resume-floor.cjs` reuses the same installed consumer and Gradle 8.10.2 global cache, runs the real Android/iOS artifact gates and limits Gradle/Xcode to two workers. Generator, tarball installation, architecture and autolinking results remain from the successful initial phases. Logs retain all attempts.

Expo configuration runs first, followed by `/private/tmp/nfc-stable-candidate/resume-expo.cjs` for full toolchain preflight, Android assembly, Pods and full Simulator application build on the same consumer. Native compilation is serialized between consumer lines. The initial generic iOS support-floor build was stopped under measured host memory pressure (16 GiB RAM; about 26 GiB of pages stored in the compressor). `/private/tmp/nfc-stable-candidate/resume-floor-ios.cjs` reuses its Android APK and consumer, then compiles the complete Simulator app with `ARCHS=arm64 ONLY_ACTIVE_ARCH=YES`; the Expo iOS continuation uses the same arm64 restriction. x86_64 is not claimed as verified by these local candidate builds. These temporary drivers are verification aids, not shipped library changes.

The first Expo 57.0.25 attempt failed Doctor on the ~57.0.27 patch expectation plus the known Directory metadata warning. The corrected 57.0.27 run passes with only that documented Directory warning. The SDK patch fixture change does not alter the packed library tarball.

## Retained native artifacts

Both consumers installed version 4.0.0 from the retained package. Their result JSON and logs are retained locally under `/private/tmp/nfc-stable-candidate/` and `/private/tmp/`:

| Consumer | Result / log | Artifact |
| --- | --- | --- |
| RN 0.76.9 | `floor-result.json`; `nfc-stable-floor-cached.log`, `nfc-stable-floor-ios-arm64.log` | `rn-nfc-native-floor-nqtDQL/NfcSupportFloor/android/app/build/outputs/apk/debug/app-debug.apk`; `rn-nfc-native-floor-nqtDQL/ios-derived-data/Build/Products/Debug-iphonesimulator/NfcSupportFloor.app` |
| Expo 57.0.27 | `expo-config-result.json`, `expo-result.json`; `nfc-stable-expo-config-retry.log`, `nfc-stable-expo-native.log` | `rn-nfc-expo-Qjtday/NfcExpoConsumer/android/app/build/outputs/apk/debug/app-debug.apk`; `rn-nfc-expo-Qjtday/ios-derived-data/Build/Products/Debug-iphonesimulator/NfcExpoConsumer.app` |

Artifact paths in this table are relative to `/var/folders/zy/g8k5wv5d1fg8n6g3s0t50d9r0000gn/T/`. Both iOS executables were inspected with `lipo -archs` and contain arm64. Android APK SHA-256 values are `2386e814f01e9b63552967e14934c255682683543ddf522e9aba4738de8b11b1` (RN 0.76.9) and `cf663321778e933e0c5bbc56049f76ddb359b87476e6ce325ec17cc014a52526` (Expo). These temporary artifacts are local evidence, not distributed builds.

## Hardware risk and attributed reuse

Since published beta.11, native implementation, Codegen, plugin and library dependencies are unchanged. The representative Expo fixture moved from 57.0.25 to 57.0.27 because the real Doctor gate now requires ~57.0.27; React Native remains 0.86.3. Earlier device records are not proof of Expo 57.0.27 hardware behavior. New developer diagnostics affect unsupported-version/architecture warnings and unavailable-module errors; the supported NFC session/I/O implementation is unchanged. Their four real RN 0.76.9 Android/iOS New/Legacy runtime probe results were recorded on the earlier locally modified beta.11 candidate (hash `2c52f4fbfa6bd05de4ffd4dab175dbe3dcf391da321d22753ba50979a7c01900`), before committing the diagnostic changes. These emulator/simulator probes establish runtime diagnostics only.

| Flow | Attributed evidence and review |
| --- | --- |
| Start/support/enabled, NDEF request/getTag/read/cancel/repeated request/cleanup | Reuse [Expo 57.0.25 record](./EXPO_VALIDATION_2026-09-29.md): local beta.9 candidate, hash d18b7437…, iPhone 15 Plus/iOS 26.6.1 and Samsung SM-N975U1/Android 12. Android NTAG215; iPhone NDEF tag model not recorded. Native baseline paths are unchanged. This reuse covers library flows, not new Expo 57.0.27 device integration. |
| One-shot event counts, NDEF session timeout, background/resume | Reuse the separately attributed [Expo 57.0.21 smoke record](./EXPO_SMOKE_2026-09-29.md) on the same named devices. These broader flows were not all repeated on 57.0.25 and are not relabeled as final-candidate tests. |
| Android NfcA transceive, failed I/O and subsequent recovery | NTAG215 normal reads in the Expo 57.0.25 record; malformed-command rejection/cleanup/subsequent NDEF read on RN 0.84 in [beta.9 validation](./V4_RELEASE_VALIDATION_2026-09-29.md). No transceive/session implementation changes in this candidate. |
| Cached NFC-A/NFC-V/ISO-DEP over NFC-A metadata | Reuse [October 9 metadata record](./ANDROID_TAG_METADATA_VALIDATION_2026-10-09.md): bdb0fb4 locally modified beta.10, Samsung SM-N975U1/Android 12. Cached metadata is unchanged; this is not technology-specific I/O evidence. |
| Android live getNdefMessage after same-session write | Contributor-reported Galaxy A53/Android 16/MIFARE Ultralight evidence from [PR #843](https://github.com/revtel/react-native-nfc-manager/pull/843), retained in beta.11 notes. Maintainer same-session write/read remains unverified without a writable NDEF tag; cached getTag/read evidence does not cover this regression. |
| NDEF Unicode/byte-buffer decoding | Candidate unit regressions cover decoding without modifying input; these are software parser checks, not new NFC transport behavior. |

No physical-device test was rerun in this candidate-preparation step; basic Expo 57.0.27 device integration remains unverified. Reuse retains each original package/device/OS/tag identity. Missing iOS ISO 15693 commands, configured Android transceive timeout/tag-removal recovery, NFC-V/ISO-DEP transceive, ISO-DEP over NFC-B metadata and maintainer writable-tag regression remain **unverified**. Hosted EAS and App Store evidence remain deferred.

The example clean install and 15 mocked tests passed after parent lock metadata synchronization. RN 0.84 example `rbenv exec bundle exec pod install` also passed; its tracked Pod lock changes only react-native-nfc-manager version (beta.10 → 4.0.0) and checksum. No other Pod dependency version changed. Generated Codegen/Pods output stays ignored.

## Before publication

The Expo SDK patch change requires focused Development Build device integration checks under the support policy before publication; it does not require repeating the complete NFC device suite. This candidate preparation has completed compiler checks only for that SDK change.

Commit the reviewed candidate only when authorized; obtain successful full CI on that exact main SHA, preview the unpublished candidate, and review the above evidence gaps. npm publication requires a separate authorized operation. Check package integrity, dist-tags, Git tag/release and clean consumer installation after publication, then update public availability claims and React Native Directory metadata. Do not treat the prior main baseline run as stable-candidate CI.
