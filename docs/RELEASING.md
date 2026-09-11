# Release Validation

This checklist separates package, Codegen, native compiler, simulator, and physical-device evidence. Passing a lower layer does not establish a higher one.

## Routine validation

Run the Node.js checks from the repository root:

```sh
npm run build
npm run lint
npm run typecheck
npm test -- --runInBand
npm run verify:package
npm run verify:codegen
```

`verify:codegen` builds and packs the library, installs that tarball into isolated temporary consumers, and runs Android and iOS Codegen from React Native 0.76.9, 0.77.3, and 0.84.0. It does not run Gradle, CocoaPods, Xcode, simulators, emulators, or NFC hardware.

To reproduce one version, pass its exact version after the focused command:

```sh
npm run verify:codegen:version -- 0.77.3
```

Run the beta.8 EventEmitter parser regression assertion with:

```sh
npm run verify:codegen:regression
```

Update the matrix whenever the TurboModule specification, packed package layout, React Native support floor, or current development baseline changes. A matrix result is evidence only for the exact versions listed.

## Example and native release gates

Run example Jest separately and label it mocked application-interaction coverage:

```sh
cd example
npm test -- --runInBand
```

Before a release, compile the React Native 0.84 New Architecture example for Android and iOS using the commands in `AGENTS.md`. These builds remain separate from routine Codegen CI and must be recorded as compiler or simulator evidence, not hardware NFC evidence.

Before promoting v4 to stable while React Native 0.76 remains the support floor, run the packed-package native consumer gate from the repository root:

```sh
npm run verify:native:support-floor
```

For focused diagnosis, run either platform independently:

```sh
npm run verify:native:support-floor:android
npm run verify:native:support-floor:ios
```

The validator pins React Native 0.76.9, React 18.3.1, React Native Community CLI 15.0.1, Node.js 22, Java 17, Ruby 3.1.2, CocoaPods 1.15.2, ffi 1.17.0, Android compile SDK 35/NDK 26.1, and the current Xcode selected by `xcodebuild`. It builds and packs the library, installs the tarball into a generated New Architecture consumer, rejects repository dependency fallback, verifies autolinking, and requires an Android debug APK and unsigned iOS Simulator app.

RN 0.76.9 pins `fmt` 11.0.2, whose consteval detection is incompatible with Apple Clang 21 in Xcode 26. On Xcode 26 or newer, the validator reports a separate compatibility phase and disables `fmt` consteval only in the disposable consumer's downloaded Pods header. The phase fails if the expected upstream header revision is absent; it never patches the library or repository source.

Temporary consumers, caches, tarballs, Pods, DerivedData, and build outputs are removed on success or failure. Add `-- --keep-temp` to a root command only while diagnosing a failure. Release evidence must record the command, candidate version/tarball, RN and toolchain versions, completed phase, expected artifact, and outcome. A failed Android or iOS gate blocks stable promotion until corrected or until the declared support floor is explicitly raised.

Run the documented physical-device smoke tests before a release candidate whenever runtime JavaScript, native NFC behavior, session state, callbacks, events, errors, cancellation, timeout, or cleanup changes. A tooling-only Codegen matrix change does not by itself require repeating physical-device NFC tests.

## Expo stable-promotion gate

The representative Expo consumer uses Expo SDK 57.0.21, React Native 0.86.3, and the New Architecture. It installs the packed candidate rather than the repository checkout.

Run configuration generation without native compilation:

```sh
npm run verify:expo:config
```

Run either native platform independently, or both:

```sh
npm run verify:expo:android
npm run verify:expo:ios
npm run verify:expo
```

The validator runs prebuild and Expo Doctor for every mode, verifies the generated NFC configuration, package provenance, host-owned config-plugin version, and Expo autolinking, then requires an APK and/or unsigned iOS Simulator app for selected native platforms. Temporary output is removed by default; append `-- --keep-temp` only for diagnosis.

Expo Doctor currently reports that the package is untested on the New Architecture because React Native Directory lacks v4 metadata. Record that single accepted external warning. Any additional Doctor failure, prebuild failure, duplicate config-plugin runtime, Codegen warning from `NfcManager`, or missing native artifact fails the gate.

Local prebuild and compiler success are not hosted EAS Build evidence and do not exercise NFC. Before stable promotion, use a custom Expo Development Build on physical devices and record each applicable row:

| Platform | Device / OS | Tag technology | Required flow | Status |
|---|---|---|---|---|
| Android | Record exact device and OS | NDEF | `start()`, support/enabled checks, request, tag read, cancel | Pending |
| Android | Record exact device and OS | NfcA | `transceive()`, timeout, repeated request, cleanup | Pending |
| iOS | Record exact device and OS | NDEF | `start()`, support checks, request, tag read, cancel/session close | Pending |
| iOS | Record exact device and OS | ISO 15693 when available | command, timeout, cancellation, cleanup | Pending |

Record background/resume behavior and event occurrence counts on both platforms. Unavailable hardware remains explicitly unverified. A hosted EAS Development Build can be recorded as additional evidence but is not inferred from these local commands.

When v4 becomes the default stable npm line, update the package's React Native Directory entry to the appropriate New Architecture classification and confirm that Expo Doctor no longer reports the metadata warning. Do not apply a package-wide classification early if it would misrepresent legacy v3 consumers.

## Release operation

Only after all applicable gates are recorded should the maintainer run the beta release command. Confirm the intended prerelease version and npm `beta` dist-tag before publishing; commit, tag, push, GitHub release creation, and npm publication remain separately reviewable release actions.
