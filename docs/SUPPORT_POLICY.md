# Support Policy

This document defines the v4 support scope for `react-native-nfc-manager` and distinguishes API intent from recorded validation evidence.

## Versioning Policy

- The v4 support floor is React Native **0.76** with the New Architecture enabled. React Native 0.76 is the first release where the New Architecture is enabled by default and declared production-ready.
- The current verified development and compiler baseline is React Native **0.84**.
- React Native **0.82 and newer are New Architecture only**. This policy does not imply that every such minor has been tested.
- A combination is verified only at the evidence level explicitly recorded below. Unlisted combinations are unverified, not implicitly covered by a rolling window.
- v3 remains the legacy-architecture line; v4 closeout work does not revalidate v3.

## Runtime Targets

### Library API contract

- JavaScript API: public API in `src/` and `index.d.ts`
- Native bridge: TurboModule + Codegen path (`specs/`) with compatibility bridge files required by React Native integration
- React Native 0.76–0.81 must keep the New Architecture enabled; their Legacy Architecture mode is outside the v4 support contract.

### iOS toolchain baseline

- Minimum Swift language version for iOS native sources: **Swift 5.7**
- Minimum iOS deployment target: **15.1**, matching the React Native 0.76 support floor
- Maintainers should validate iOS builds with an Xcode toolchain that supports Swift 5.7+
- RN 0.76.9's pinned `fmt` 11.0.2 requires the documented, disposable-consumer consteval adjustment when the support-floor build is run with Xcode 26 or newer. This is an upstream RN dependency/toolchain compatibility step, not a library source patch.

### Example app policy

- Primary development example: **React Native CLI** (`example/`)
- Representative secondary consumer: pinned **Expo SDK 57.0.25 / React Native 0.86.3** prebuild + custom Development Build
- Expo Go is unsupported because it cannot load this package's custom native module

## Verification Matrix

| React Native | Architecture | Codegen | Android | iOS | Status |
|---|---|---|---|---|---|
| 0.84.0 | New Architecture | Packed package generated for both platforms | Example application compiled with the 0.84 development line | Pods resolved and simulator application compiled with the 0.84 development line | Current Codegen and compiler baseline |
| 0.77.3 | New Architecture | Packed package generated for both platforms | Not compiled | Not compiled | Codegen regression line only |
| 0.76.9 | New Architecture | Packed package generated for both platforms | Clean packed-package consumer assembled | Pods resolved and clean packed-package simulator application compiled | Codegen-and-native-build verified support floor; no RN 0.76 hardware claim |
| 0.83 | New Architecture | Not run | Not run | Not run | Unverified |
| 0.82 | New Architecture | Not run | Not run | Not run | Unverified |
| Other 0.76–0.81 versions | New Architecture | Not run | Not run | Not run | Supported; best-effort/unverified until separately tested |
| Earlier than 0.76 | New or legacy | Outside v4 scope | Outside v4 scope | Outside v4 scope | Unsupported |

### Expo integration evidence

| Expo | React Native | Architecture | Prebuild | Android | iOS | Status |
|---|---|---|---|---|---|---|
| 57.0.21 | 0.86.3 | New Architecture | Packed-package plugin output verified | Generated consumer APK compiled | Pods, Codegen, unsigned Simulator app, and signed device app compiled | Local Development Build integration and recorded basic device smoke flows verified; Expo Doctor gate incomplete; hosted EAS unverified |
| 57.0.25 | 0.86.3 | New Architecture | Packed-package plugin output verified | Clean consumer and Development Build APKs compiled | Pods, Codegen, unsigned Simulator app and signed device app compiled | Full local consumer gate and basic iPhone/Android regressions passed with the accepted Directory metadata warning; hosted EAS unverified |

The [2026-09-29 physical-device smoke record](./EXPO_SMOKE_2026-09-29.md)
covers iPhone 15 Plus / iOS 26.6.1 NDEF flows and Samsung SM-N975U1 / Android 12
NDEF flows plus NTAG215 NfcA reads. It records a local beta.9 working-tree
candidate, user-reported scan results, and untested flows. Expo Doctor also
reported that the pinned Expo 57.0.21 differs from the expected ~57.0.25;
this additional failure leaves the Doctor gate incomplete.

The [Expo 57.0.25 validation record](./EXPO_VALIDATION_2026-09-29.md)
records a subsequent clean packed-package consumer run. The Expo patch mismatch
was resolved and the local compiler/Doctor gate passed. Basic iPhone and Android
reads, cancellation, and subsequent reads also passed on the updated Development
Build, including Android NTAG215 NfcA reads and scan-prompt closure. Broader flows
from the earlier smoke record were not all repeated on 57.0.25.

The Expo validator accepts the currently known React Native Directory warning that `react-native-nfc-manager` is not yet marked as New Architecture tested. This is external metadata, not build evidence. The metadata SHALL be updated in coordination with v4 becoming the default stable package so the legacy v3 line is not mislabeled prematurely.

The representative Codegen rows record only the exact versions shown; they do not imply that every intervening React Native minor was compiled or tested. Routine CI uses Node.js 22 and validates install, TypeScript build, lint, root and example mocked Jest tests, type checking, packed-package contents, and Android/iOS Codegen generation for React Native 0.76.9, 0.77.3, and 0.84.0. Separate CI jobs compile the RN 0.84 Android and unsigned iOS Simulator applications for relevant changes. Documentation-only changes skip native builds; manual candidate validation forces both. A successful aggregate gate on a documentation-only change is not compiler evidence. Example Jest runs in the validation job and provides mocked application-interaction coverage. CI runs on pull requests and v4 pushes; workflow configuration is not itself proof of a successful hosted run.

RN 0.76.9 native-build evidence is produced by the release-only support-floor validator, not routine CI. It installs the actual packed candidate into a generated consumer and checks both application artifacts. On Xcode 26+, the iOS run reports and applies the narrow `fmt` compatibility adjustment described above inside the disposable Pods directory.

Compiler and simulator evidence does not establish physical-device NFC behavior. No Android or iOS device, OS, or tag technology is considered verified until a release record names it and records the tested flow and outcome.

The [2026-09-29 beta.9 validation checkpoint](./V4_RELEASE_VALIDATION_2026-09-29.md)
also records successful RN 0.76/0.84 compiler checks and RN 0.84 Android
malformed-NfcA-command rejection, cleanup, and subsequent NDEF read recovery on
Samsung SM-N975U1 / Android 12 / NTAG215. Cached NFC-A `atqa` and `sak` were
observed in the recovery payload. Other technology metadata and specifically
configured transceive timeouts were not verified by that test.

## Release Quality Gates

For each release candidate:

- Required: packed-package Android/iOS Codegen matrix for RN 0.76.9, 0.77.3, and 0.84.0
- Required before stable promotion while RN 0.76 remains supported: clean packed-package RN 0.76.9 New Architecture Android and iOS application builds
- Required before stable promotion: clean packed-package Expo SDK 57.0.25 / RN 0.86.3 prebuild, Expo Doctor review, Android application build, and iOS pod/Codegen/application build
- Required: RN 0.84 New Architecture Android and iOS compiler checks
- Optional: older React Native lines only when the release claims them
- Required physical-device flows:
  - `start()` and `isSupported()`
  - `requestTechnology()` + `cancelTechnologyRequest()`
  - NDEF read path (`getTag()` / `getNdefMessage()`)
- Required physical-device records include platform, device, OS, tag technology, flow, and outcome.
- Required before claiming Expo hardware verification: physical-device Expo Development Build records for the applicable NFC flows

## Known Constraints

- NFC requires native capabilities/permissions and physical hardware.
- iOS requires entitlement and Info.plist NFC keys.
- Android requires NFC permission and NFC-enabled devices.
- Mocks, simulators, emulators, and compiler checks must not be reported as NFC hardware validation.
- Local Expo prebuild and native compilation must not be reported as hosted EAS Build evidence.

## Ownership

- Maintainers update this file whenever:
  - React Native support window changes
  - CI matrix changes
  - architecture support expectations change

## Stable preparation and branch policy

`v4` is the active development and release branch; `main` currently retains v3.
The package remains a beta until a separately reviewed stable publication.
See [Migration](./MIGRATING_V3_TO_V4.md) and the
[stable cutover procedure](./RELEASING.md#stable-cutover-procedure).
GitHub default-branch selection and npm `latest` are independent operations.
