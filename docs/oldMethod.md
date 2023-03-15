### Old Style (registerTagEvent) To Scan NFC Tags

There's an alterntaive style to scan NFC tags through `NfcManager.registerTagEvent`, like this:

```javascript
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

// The following function resolves to a NFC Tag object using old event listener approach.
// You can call it like this:
//    `const nfcTag = await listenToNfcEventOnce()`

function listenToNfcEventOnce() {
  const cleanUp = () => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.setEventListener(NfcEvents.SessionClosed, null);
  };

  return new Promise((resolve) => {
    let tagFound = null;

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
      tagFound = tag;
      resolve(tagFound);
      NfcManager.unregisterTagEvent();
    });

    NfcManager.setEventListener(NfcEvents.SessionClosed, () => {
      cleanUp();
      if (!tagFound) {
        resolve();
      }
    });

    NfcManager.registerTagEvent();
  });
}
```

As you can see, the above approach is more verbose and hard-to-read, so we recommend using `NfcManager.requestTechnology` instead of `NfcManager.registerTagEvent` in your application.