# API and technology handlers

Use the [safe scan lifecycle](../guide/reading-ndef.md#session-lifecycle) before technology-specific operations. The [public TypeScript declarations](https://github.com/revtel/react-native-nfc-manager/blob/v4/index.d.ts) define method signatures, results and platform availability.

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

## Android cached tag metadata

Android tag results from discovery and `getTag()` may include these optional, discovery-time fields when the tag supports the corresponding technology:

| Technology | Fields |
| --- | --- |
| NFC-A | `atqa: number[]`, `sak: number` |
| NFC-V | `dsfid: number`, `responseFlags: number` |
| ISO-DEP | `historicalBytes: number[]`, `hiLayerResponse: number[]` |

Byte values are unsigned (0–255). An unsupported or unavailable field is omitted; check for its presence before using it. These values come from Android's cached tag discovery data and do not trigger another NFC command. The new NFC-A and NFC-V fields and `hiLayerResponse` are Android-only; `historicalBytes` can also be reported by iOS ISO 7816 tags.

The [2026-10-09 device record](../ANDROID_TAG_METADATA_VALIDATION_2026-10-09.md) covers representative NFC-A, NFC-V and ISO-DEP over NFC-A metadata. ISO-DEP over NFC-B `hiLayerResponse` remains unverified.
