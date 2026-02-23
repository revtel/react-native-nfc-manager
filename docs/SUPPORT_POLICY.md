# Support Policy

This document defines the official support scope for `react-native-nfc-manager` and serves as the source of truth for example apps and CI verification.

## Versioning Policy

- React Native support follows a rolling window of **N, N-1, N-2** minor versions.
- Official support is based on combinations that pass CI and smoke tests in this repository.
- Combinations not listed as verified are considered best-effort.
- For React Native **0.82+**, treat runtime as **New Architecture only**.

## Runtime Targets

### Library API contract

- JavaScript API: public API in `src/` and `index.d.ts`
- Native bridge:
  - Old Architecture: Native Modules bridge path
  - New Architecture: TurboModule + Codegen path (`specs/`)

### iOS toolchain baseline

- Minimum Swift language version for iOS native sources: **Swift 5.7**
- Maintainers should validate iOS builds with an Xcode toolchain that supports Swift 5.7+

### Example app policy

- Primary development example: **React Native CLI** (`example/`)
- Secondary validation example (later phase): Expo prebuild + custom dev client
- `Expo Go` is not an official target for this NFC native module

## Verification Matrix

This matrix is the Phase 0 baseline and should be maintained per release.

| Axis | Values |
|---|---|
| React Native | N, N-1, N-2 |
| Platform | iOS, Android |
| Architecture | New Architecture (RN 0.82+), Old + New (older RN lines only when explicitly tested) |
| Example type | RN CLI (required), Expo prebuild/dev-client (future phase) |

## Release Quality Gates

For each release candidate:

- Required (RN 0.82+): RN CLI smoke checks pass on:
  - iOS + New Architecture
  - Android + New Architecture
- Optional (older RN lines only): Old Architecture checks if that line is still claimed as supported
- Required smoke flows:
  - `start()` and `isSupported()`
  - `requestTechnology()` + `cancelTechnologyRequest()`
  - NDEF read path (`getTag()` / `getNdefMessage()`)
- Optional (later): Expo prebuild/dev-client smoke run

## Known Constraints

- NFC requires native capabilities/permissions and physical hardware.
- iOS requires entitlement and Info.plist NFC keys.
- Android requires NFC permission and NFC-enabled devices.

## Ownership

- Maintainers update this file whenever:
  - React Native support window changes
  - CI matrix changes
  - architecture support expectations change
