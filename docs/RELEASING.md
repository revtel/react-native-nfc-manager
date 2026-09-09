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

Run the documented physical-device smoke tests before a release candidate whenever runtime JavaScript, native NFC behavior, session state, callbacks, events, errors, cancellation, timeout, or cleanup changes. A tooling-only Codegen matrix change does not by itself require repeating physical-device NFC tests.

## Release operation

Only after all applicable gates are recorded should the maintainer run the beta release command. Confirm the intended prerelease version and npm `beta` dist-tag before publishing; commit, tag, push, GitHub release creation, and npm publication remain separately reviewable release actions.
