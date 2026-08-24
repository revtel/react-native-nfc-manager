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

### Example app policy

- Primary development example: **React Native CLI** (`example/`)
- Secondary validation example (later phase): Expo prebuild + custom dev client
- `Expo Go` is not an official target for this NFC native module

## Verification Matrix

| React Native | Architecture | Android | iOS | Status |
|---|---|---|---|---|
| 0.84 | New Architecture | Example application compiled | Pods resolved and simulator application compiled | Current verified compiler baseline |
| 0.83 | New Architecture | Not run | Not run | Unverified |
| 0.82 | New Architecture | Not run | Not run | Unverified |
| 0.76–0.81 | New Architecture | Not run | Not run | Supported floor; best-effort/unverified until separately tested |
| Earlier than 0.76 | New or legacy | Outside v4 scope | Outside v4 scope | Unsupported |

Routine CI uses Node.js 22 and validates install, TypeScript build, lint, root mocked Jest tests, and type checking. It does not compile native applications. Example Jest is run separately and is mocked application-interaction coverage.

Compiler and simulator evidence does not establish physical-device NFC behavior. No Android or iOS device, OS, or tag technology is considered verified until a release record names it and records the tested flow and outcome.

## Release Quality Gates

For each release candidate:

- Required: RN 0.84 New Architecture Android and iOS compiler checks
- Optional: older React Native lines only when the release claims them
- Required physical-device flows:
  - `start()` and `isSupported()`
  - `requestTechnology()` + `cancelTechnologyRequest()`
  - NDEF read path (`getTag()` / `getNdefMessage()`)
- Required physical-device records include platform, device, OS, tag technology, flow, and outcome.
- Optional (later): Expo prebuild/dev-client validation

## Known Constraints

- NFC requires native capabilities/permissions and physical hardware.
- iOS requires entitlement and Info.plist NFC keys.
- Android requires NFC permission and NFC-enabled devices.
- Mocks, simulators, emulators, and compiler checks must not be reported as NFC hardware validation.

## Ownership

- Maintainers update this file whenever:
  - React Native support window changes
  - CI matrix changes
  - architecture support expectations change
