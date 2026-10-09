# Technology compatibility

| Technology | Android | iOS | Access on `NfcManager` |
| --- | --- | --- | --- |
| `Ndef` | ✅ | ✅ | `getTag()`, `ndefHandler` |
| `NfcA` | ✅ | ✅ | `nfcAHandler` |
| `IsoDep` | ✅ | ✅ | `isoDepHandler` |
| `NfcB` | ✅ | ❌ | Android `transceive()` |
| `NfcF` | ✅ | ❌ | Android `transceive()` |
| `NfcV` | ✅ | ❌ | `nfcVHandler` |
| `MifareClassic` | ✅ | ❌ | `mifareClassicHandlerAndroid` |
| `MifareUltralight` | ✅ | ❌ | `mifareUltralightHandlerAndroid` |
| `NdefFormatable` | ✅ | ❌ | `ndefFormatableHandlerAndroid` |
| `MifareIOS` | ❌ | ✅ | `sendMifareCommandIOS()` |
| `Iso15693IOS` | ❌ | ✅ | `iso15693HandlerIOS` |
| `FelicaIOS` | ❌ | ✅ | `sendFelicaCommandIOS()` |

This table describes the intended platform API availability. It is not a record of the devices, OS versions, or tag technologies verified for a particular release; see the [Support Policy](../SUPPORT_POLICY.md) for evidence labels and limitations.
