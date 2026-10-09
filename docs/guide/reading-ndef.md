# Read NDEF tags

Complete [installation](./installation.md) and platform setup first. Trigger the scan from an explicit user action on an NFC-capable physical device.

This screen reads NDEF records and keeps one scan active at a time:

```javascript
import React, {useRef, useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

function App() {
  const scanning = useRef(false);
  const [busy, setBusy] = useState(false);

  async function readNdef() {
    // A ref also blocks rapid taps before React renders the disabled button.
    if (scanning.current) return;
    scanning.current = true;
    setBusy(true);
    let requestAttempted = false;
    try {
      await NfcManager.start();
      requestAttempted = true;
      await NfcManager.requestTechnology(NfcTech.Ndef);
      const tag = await NfcManager.getTag();
      console.warn('NDEF records', tag?.ndefMessage ?? []);
    } catch (ex) {
      // Includes initialization, request, cancellation and tag-I/O failures.
      console.warn('NFC scan ended', ex);
    } finally {
      try {
        if (requestAttempted) {
          // Await cleanup before permitting a subsequent scan.
          await NfcManager.cancelTechnologyRequest();
        }
      } catch (cleanupError) {
        console.warn('NFC cleanup failed', cleanupError);
      } finally {
        scanning.current = false;
        setBusy(false);
      }
    }
  }

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={readNdef} disabled={busy}>
        <Text>Scan a Tag</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
```

## Session lifecycle

Await `start()` before requesting a technology. Initialization does not start a scan. Request the technology, read the tag or use its handler, then await cancellation before allowing another request. The example guards rapid repeated taps and handles both operation and cleanup failures.

For technology-specific operations, see [API and handlers](../reference/api.md). A transceive timeout does not imply a timeout while waiting for a tag.
