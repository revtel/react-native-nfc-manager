
## Advanced Usage Example: NDEF-Writing

For example, here's an example to write NDEF:

```javascript
import NfcManager, {NfcTech, Ndef} from 'react-native-nfc-manager';

async function writeNdef({type, value}) {
  let result = false;

  try {
    // STEP 1
    await NfcManager.requestTechnology(NfcTech.Ndef);

    const bytes = Ndef.encodeMessage([Ndef.textRecord('Hello NFC')]);

    if (bytes) {
      await NfcManager.ndefHandler // STEP 2
        .writeNdefMessage(bytes); // STEP 3
      result = true;
    }
  } catch (ex) {
    console.warn(ex);
  } finally {
    // STEP 4
    NfcManager.cancelTechnologyRequest();
  }

  return result;
}
```

## Advanced Usage Example: Mifare Ultralight

Here's another example to read a Mifare Ultralight tag:

```javascript
async function readMifare() {
  let mifarePages = [];

  try {
    // STEP 1
    let reqMifare = await NfcManager.requestTechnology(
      NfcTech.MifareUltralight,
    );

    const readLength = 60;
    const mifarePagesRead = await Promise.all(
      [...Array(readLength).keys()].map(async (_, i) => {
        const pages = await NfcManager.mifareUltralightHandlerAndroid // STEP 2
          .mifareUltralightReadPages(i * 4); // STEP 3
        mifarePages.push(pages);
      }),
    );
  } catch (ex) {
    console.warn(ex);
  } finally {
    // STEP 4
    NfcManager.cancelTechnologyRequest();
  }

  return mifarePages;
}
```

To see more examples, please see [React Native NFC ReWriter App](https://github.com/revtel/react-native-nfc-rewriter)

