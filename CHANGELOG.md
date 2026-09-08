## [4.0.0-beta.9](https://github.com/revtel/react-native-nfc-manager/compare/v4.0.0-beta.8...v4.0.0-beta.9) (2026-09-08)

### Bug Fixes

- Support React Native 0.76 and 0.77 TypeScript Codegen event parsing by using a directly imported `EventEmitter` type.

## [4.0.0-beta.8](https://github.com/revtel/react-native-nfc-manager/compare/v4.0.0-beta.7...v4.0.0-beta.8) (2026-09-08)

This section records changes since `v4.0.0-beta.7`. It does not announce a release or promote v4 to stable.

### Changed

- Migrated the library source to TypeScript, the iOS implementation to Swift with an Objective-C++ bridge, and the Android implementation into focused Java handlers.
- Updated the primary development example to React Native 0.84 with the New Architecture enabled.
- Aligned the public runtime API, `index.d.ts`, public type coverage, TurboModule Codegen spec, and applicable native implementations.
- Added repeatable package-content validation and confirmed `prepack` rebuilds the untracked `dist/` output used by consumers.
- Routine CI now uses Node.js 22 and remains limited to JavaScript and TypeScript validation. Android/iOS compiler checks and physical-device NFC checks are separate release gates.

### Fixed

- Native request callbacks and cleanup paths now prevent repeated completion and stale callback/session ownership across success, error, cancellation, timeout, repeated-request, and lifecycle paths.
- Android cancellation cleans up temporary tag registration and NFC lifecycle resources.
- iOS session state changes are serialized and session callbacks are completed at most once.
- Common, Android-only, iOS-only, deprecated, unsupported, and compatibility-alias declarations now match the intended v4 runtime contract.

### Compatibility and migration notes

- Removed the unintended refactor-only `hello` and `echo` runtime helpers; they were not part of the declared or documented v4 API.
- Direct NDEF compatibility methods and `getBackgroundNdef()` remain available.
- The misspelled iOS ISO 15693 `stayQuite()` entry point remains as a compatibility alias for `stayQuiet()`.
- Deprecated Android `setNdefPushMessage()` continues to reject explicitly rather than acting as a supported operation.
- The v4 support floor is React Native 0.76 with the New Architecture enabled. React Native 0.82 and newer are New Architecture only. The verified development and compiler baseline is React Native 0.84; React Native 0.76–0.83 remains best-effort/unverified until corresponding evidence is recorded.
- The package now declares React 18.2 and React Native 0.76 as its minimum peer versions, and the podspec now declares iOS 15.1 to match that React Native support floor.

### Known limitations

- Jest and example Jest use native mocks and do not verify NFC hardware behavior.
- Simulator/emulator and compiler success do not verify tag discovery, I/O, cancellation timing, timeout, background/resume, or cleanup on a physical device.
- Physical-device results must be recorded separately by platform, device, OS, tag technology, flow, and outcome before release-candidate review.
- Completion of this closeout makes another v4 beta eligible for review; stable promotion remains a separate decision.

## [3.0.2](https://github.com/whitedogg13/react-native-nfc-manager/compare/v3.0.1...v3.0.2) (2021-02-22)


### Features

* **android:** allow requestTechnology resolves to tags even when tech ([8b7f862](https://github.com/whitedogg13/react-native-nfc-manager/commit/8b7f8629a8e46304f2a68d62f01e745047fe01dc))



## [3.0.1](https://github.com/whitedogg13/react-native-nfc-manager/compare/v3.0.0...v3.0.1) (2021-02-20)


### Bug Fixes

* [#371](https://github.com/whitedogg13/react-native-nfc-manager/issues/371) missing MIFARE_BLOCK_SIZE for mifareClassicHandlerAndroid ([b136419](https://github.com/whitedogg13/react-native-nfc-manager/commit/b1364197c80ab16542bbb823483a2079a896e169))



# [3.0.0](https://github.com/whitedogg13/react-native-nfc-manager/compare/v3.0.0-0...v3.0.0) (2021-02-18)


### Features

* expose RTD_URI_PROTOCOLS ([26516a7](https://github.com/whitedogg13/react-native-nfc-manager/commit/26516a7ce8309ade21464df13a8e5c799c0e417c))



# [3.0.0-0](https://github.com/whitedogg13/react-native-nfc-manager/compare/v2.0.0-beta.1...v3.0.0-0) (2021-02-10)


### Bug Fixes

* disable 18092 polling (cause iOS freeze) ([64115f8](https://github.com/whitedogg13/react-native-nfc-manager/commit/64115f80f8cd93ed5ef3b01987d6c628a5a9127b))
* **ios:** add polling for iso18092 ([b7984a5](https://github.com/whitedogg13/react-native-nfc-manager/commit/b7984a59ea27076d7fd34a2614592f468c80f5e1))
* add callback type null possible ([1371533](https://github.com/whitedogg13/react-native-nfc-manager/commit/13715334ea908b89654b42eba4ec902bcc6f4229))
* cancelTechnology might cause exception if there's a connected tag ([af2f1f9](https://github.com/whitedogg13/react-native-nfc-manager/commit/af2f1f92bbd7bfcf8c604db48b790289c3ca4946))
* cancelTechnology might cause exception if there's a connected tag ([dcb26b8](https://github.com/whitedogg13/react-native-nfc-manager/commit/dcb26b85a955ce17ae633e00f6f189a895e8adcb))
* getNdefMessage should use the same structure for platforms ([73859fb](https://github.com/whitedogg13/react-native-nfc-manager/commit/73859fbac8939277f1e7fc2ad13ececee8c9d4c7))
* import NfcManager from new location ([c95cc76](https://github.com/whitedogg13/react-native-nfc-manager/commit/c95cc76a0a3b52c751c1a0f00895cf1b34b66b28))
* ios isSupported ([adcc966](https://github.com/whitedogg13/react-native-nfc-manager/commit/adcc966c8ed4a565c2800fabc5e5a0cad07ea376))
* promise won't be rejected when calling cancelTechnologyRequest in ([64c9cbd](https://github.com/whitedogg13/react-native-nfc-manager/commit/64c9cbd05e34e975fa4744727859efd08ea610bf))
* reject tech request promise when native iOS cancel button is pressed ([7915b98](https://github.com/whitedogg13/react-native-nfc-manager/commit/7915b98132cf5c6f86eb96dfe242b67bef32e8a7))
* remove getNdefMessage's parameter declaration ([6fc257e](https://github.com/whitedogg13/react-native-nfc-manager/commit/6fc257e61e1da5600a7aac44d9a8a97a7ecc988c))


### Features

* extract more NfcTech handlers ([0032408](https://github.com/whitedogg13/react-native-nfc-manager/commit/0032408af21cafa3f5f92c16083f914325450524))
* **android:** getNdefStatus ([4cc68ce](https://github.com/whitedogg13/react-native-nfc-manager/commit/4cc68ce233d81c03760b791fc2f568fe4b8415c4))
* **ios:** enhance didDetectTags and add queryNDEFStatus / makeReadOnly ([32dd3be](https://github.com/whitedogg13/react-native-nfc-manager/commit/32dd3be2968abbe095ae42fd12793a9a8c0725c6))
* invalidateSessionWithErrorIOS ([c631110](https://github.com/whitedogg13/react-native-nfc-manager/commit/c631110b6454c08821607014a28b8dffb20fe8b0))
* ios 13 ndef read and write ([31a3ae6](https://github.com/whitedogg13/react-native-nfc-manager/commit/31a3ae6e141e41f3f36a102d5c2bb5ce04ba78a5))
* requestTechnology support multi-techs ([65e8f02](https://github.com/whitedogg13/react-native-nfc-manager/commit/65e8f02b83820cb72e65c8443a607b6dca2c8fae))



# [2.0.0-beta.1](https://github.com/whitedogg13/react-native-nfc-manager/compare/0.0.9...v2.0.0-beta.1) (2019-07-13)


### Bug Fixes

* call the correct method `mifareUltralightReadPages` (notice the tailing s) ([60feee8](https://github.com/whitedogg13/react-native-nfc-manager/commit/60feee88c2d20bc18af23b3abb6d8cb22fe17e16))
* ios crash on registerTagEvent ([e654d93](https://github.com/whitedogg13/react-native-nfc-manager/commit/e654d9359751327284d20b3bee1139c78657dcb4))
* MifareClassic should also support `transceive` ([dd4a902](https://github.com/whitedogg13/react-native-nfc-manager/commit/dd4a902257a402e5d6d3eae8bd43f9d37c03928b))
* use non-cached ndef for getNdefMessage API ([49f8541](https://github.com/whitedogg13/react-native-nfc-manager/commit/49f85415a5bc6d0218992dc6ba2b9303cee8e3ac))


### Features

* mifareultralight support ([4a53a13](https://github.com/whitedogg13/react-native-nfc-manager/commit/4a53a135c594ef340927ae053dfc142ebfd0b9b6))
* support `getMaxTransceiveLength` and `setTimeout` ([e759c39](https://github.com/whitedogg13/react-native-nfc-manager/commit/e759c399008e9060ae6f5fe23d7b31a61b1f8037))



## [0.0.9](https://github.com/whitedogg13/react-native-nfc-manager/compare/0.0.8...0.0.9) (2018-01-02)



## [0.0.8](https://github.com/whitedogg13/react-native-nfc-manager/compare/0.0.7...0.0.8) (2017-12-09)



## [0.0.7](https://github.com/whitedogg13/react-native-nfc-manager/compare/0.0.6...0.0.7) (2017-12-04)



## [0.0.6](https://github.com/whitedogg13/react-native-nfc-manager/compare/0.0.3...0.0.6) (2017-11-17)



## [0.0.3](https://github.com/whitedogg13/react-native-nfc-manager/compare/0.0.2...0.0.3) (2017-09-27)



## 0.0.2 (2017-08-01)
