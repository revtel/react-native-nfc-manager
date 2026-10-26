# API and technology handlers

Use the [safe scan lifecycle](../guide/reading-ndef.md#session-lifecycle) before technology-specific operations. The [public TypeScript declarations](https://github.com/revtel/react-native-nfc-manager/blob/main/index.d.ts) define method signatures, results and platform availability.

## Lifecycle and handlers

| Operation | Method |
| --- | --- |
| Initialize the module | `await NfcManager.start()` |
| Check device support | `await NfcManager.isSupported()` |
| Check adapter state | `await NfcManager.isEnabled()` |
| Request a technology | `await NfcManager.requestTechnology(NfcTech.Ndef)` |
| Read the discovered tag | `await NfcManager.getTag()` |
| End the technology request | `await NfcManager.cancelTechnologyRequest()` |

Await cleanup before starting another request. Choose the getter or platform method from the [technology table](./compatibility.md), then consult the public declarations for its command signature and result.

For example, during an active NDEF request:

```javascript
const tag = await NfcManager.ndefHandler.getNdefMessage();
const records = tag?.ndefMessage ?? [];
```

`getNdefMessage()` resolves to a tag result, rather than an array of NDEF records. Handle absent or empty `ndefMessage` before decoding records.

On Android, `getTag()` and `ndefHandler.getCachedNdefMessageAndroid()` return
discovery-time NDEF data. Use `ndefHandler.getNdefMessage()` to read the current
contents after a write, while the same NDEF request remains connected and the
tag stays in range. Await each write/read and cancel the request in `finally`.
The [development example](https://github.com/revtel/react-native-nfc-manager/blob/main/example/README.md#android-same-session-ndef-writeread-smoke-test)
includes a test that overwrites a disposable tag and verifies live readback and
re-scan persistence.

## Android NFC antenna location

Added in **4.1.0**. Android only; the platform API requires Android 14/API 34.
Call `NfcManager.getNfcAntennaInfo()` without starting a tag scan or requesting
a technology. It reports device geometry, not information about a scanned tag.

The return type is `Promise<NfcAntennaInfo | null>`; `NfcAntennaInfo` is exported
by `react-native-nfc-manager` for TypeScript consumers.

| Result field | Meaning |
| --- | --- |
| `deviceWidth` | Device width in millimeters. |
| `deviceHeight` | Device height in millimeters. |
| `deviceFoldable` | Whether the device reports itself as foldable. |
| `availableNfcAntennas` | Array of antenna positions, each with `locationX` and `locationY` in millimeters. |

The origin is the **top-left** corner when facing the screen in portrait.
Foldable device coordinates use the unfolded device with its screens facing
the user. Values are physical millimeters, not screen pixels; account for your
UI's scale and orientation when drawing an indicator.

The method resolves `null` below API 34, without an NFC adapter, when Android
returns no antenna information, or when the platform reports the operation as
unsupported. An available result can have an empty antenna list; handle both
cases. Other native errors reject the promise.

iOS has no corresponding public API. Guard the call with
`Platform.OS === 'android'`; do not call it on iOS expecting `null`.
See the [Android usage example](../guide/android.md#nfc-antenna-location).

## Android cached tag metadata

Android tag results from discovery and `getTag()` may include these optional, discovery-time fields when the tag supports the corresponding technology:

| Technology | Fields |
| --- | --- |
| NFC-A | `atqa: number[]`, `sak: number` |
| NFC-V | `dsfid: number`, `responseFlags: number` |
| ISO-DEP | `historicalBytes: number[]`, `hiLayerResponse: number[]` |

Byte values are unsigned (0–255). An unsupported or unavailable field is omitted; check for its presence before using it. These values come from Android's cached tag discovery data and do not trigger another NFC command. The new NFC-A and NFC-V fields and `hiLayerResponse` are Android-only; `historicalBytes` can also be reported by iOS ISO 7816 tags.

The [2026-10-09 device record](../ANDROID_TAG_METADATA_VALIDATION_2026-10-09.md) covers representative NFC-A, NFC-V and ISO-DEP over NFC-A metadata. ISO-DEP over NFC-B `hiLayerResponse` remains unverified.
