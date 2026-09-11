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

## Release operation

Only after all applicable gates are recorded should the maintainer run the beta release command. Confirm the intended prerelease version and npm `beta` dist-tag before publishing; commit, tag, push, GitHub release creation, and npm publication remain separately reviewable release actions.
