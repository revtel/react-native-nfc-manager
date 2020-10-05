## API
This library provide a default export `NfcManager` and 3 named exports `Ndef`, `NfcTech` and `ByteParser`, like this:
```javascript
import NfcManager, {Ndef, NfcTech, ByteParser} from 'react-native-nfc-manager'
```

All methods in `NfcManager` return a `Promise` object and are resolved to different types of data according to individual API.

* `Ndef` is an utility module to encode and decode some well-known NDEF format.
* `ByteParser` is an utility module to encode and decode byte[] arrays (used in Mifare Classic technology).
* `NfcTech` contains predefined constants for specific NFC technologies, which include `NfcA`, `NfcB`, `NfcF`, `NfcV`, `IsoDep`, `MifareClassic` and `MifareUltralight`.
    * These constants should be used with `requestTechnology` (Android Only) to obtain a NFC technology handle, and use it to perform technology specific operations.

The API documentation is grouped into 6 parts:

* [NfcManager API](##NfcManager-API)
* [Ndef API](##Ndef-API)
* [NfcTech.Ndef API](##NfcTech.Ndef-[Android-only])
* [Generic NfcTech API](##Generic-NfcTech-API-[Android-only])
* [NfcTech.MifareClassic API](##NfcTech.MifareClassic-API-[Android-only])
* [NfcTech.MifareUltralight API](##NfcTech.MifareUltralight-API-[Android-only])
* [ByteParser API](##ByteParser-API)

## NfcManager API

### start({onSessionClosedIOS})
Init the module. If the device doesn't support NFC, the returning promise will be rejected.

__Arguments__
- `onSessionClosedIOS` - `function` - [iOS only] the callback to invoke when an `NFCNDEFReaderSession` becomes invalidated

__Examples__
```js
NfcManager.start({
    onSessionClosedIOS: () => {
        console.log('ios session closed');
    }
})
    .then(result => {
        console.log('start OK', result);
    })
    .catch(error => {
        console.warn('device does not support nfc!');
        this.setState({supported: false});
    })
```

### stop()
Terminates the module. This will remove the onSessionClosedIOS listener that is attached in the `start` function.

### isSupported(tech = '')
Check if NFC (and specified NFC technology) is supported by the hardware.
When you specify a technology, some extra checks are performed to see if the technology is supported or not.
Returnes `Promise` resolved to a boolean value to indicate whether NFC (and specified NFC technology) is supported.

__Arguments__
- `tech` - `string` - optional parameter, use a constant of the NfcTech class, defaults to ''

__Examples__
```js
NfcManager.isSupported(NfcTech.MifareClassic)
    .then(() => console.log('Mifare classic is supported'))
    .catch(err => console.warn(err))
```


### isEnabled() [Android only]
Check if the NFC is enabled.
Returned `Promise` resolved to a boolean value to indicate whether NFC is enabled.

### goToNfcSetting() [Android only]
Direct the user to NFC setting.

### getLaunchTagEvent() [Android only]
Get the NFC tag object which launches the app.
Returned `Promise` resolved to the NFC tag object launching the app and resolved to null if the app isn't launched by NFC tag.

To launch your app with a tag you need to add an intent-filter to your manifest file, see example below. This filter must be set for your main activity, where you also call getLaunchTagEvent(). 
If you write text content to your tag the ndef message you filter for needs to be the first entry, otherwise if your intent-filter doesnt match the first record your `Promise` will resolve to null ([#208](https://github.com/whitedogg13/react-native-nfc-manager/issues/208)). 

```
<intent-filter>
  <action android:name="android.nfc.action.NDEF_DISCOVERED"/>
  <category android:name="android.intent.category.DEFAULT"/>
  <data android:mimeType="text/plain" />
</intent-filter>
```

Another good point is to add `android:launchMode="singleTask"` to your manifest activity. Otherwise, if your app is already running your tag will start another instance and could lead to strange behavior (thanks [@levelpic](https://github.com/levepic)). 

### registerTagEvent(listener, alertMessage, invalidateAfterFirstRead)
Start to listen to *ANY* NFC tags.

__Arguments__
- `listener` - `function` - the callback when discovering NFC tags
- `alertMessage` - `string` - (iOS) the message to display on iOS when the NFCScanning pops up
- `options` - `object` - Object containing (iOS)invalidateAfterFirstRead, (Android)isReaderModeEnabled, (Android)readerModeFlags, (Android)readerModeDelay - set delay in seconds between one-by-one tag detection (default value 10). Use `NfcAdapter` flags. **Reader mode can only be used in Android 19 or later**.

**Examples**

```js
NfcManager.registerTagEvent(
  tag => {
    console.log('Tag Discovered', tag);
  },
  'Hold your device over the tag',
  {
    invalidateAfterFirstRead: true,
    isReaderModeEnabled: true,
    readerModeFlags:
      NfcAdapter.FLAG_READER_NFC_A | NfcAdapter.FLAG_READER_SKIP_NDEF_CHECK,
      readerModeDelay: 2,
  },
);
```

### unregisterTagEvent()
Stop listening to NFC tags.

### requestNdefWrite(bytes, options) [Android only]
Request writing **NdefMessage** (constructed by `bytes` array you passed) into next discovered tag.
Notice you must call `registerTagEvent` first before calling this. 

__Arguments__
- `bytes` - `array` - the full NdefMessage, which is an array of number
- `options` - `object` - optional argument used to trigger actions such as `format` or `formatReadOnly`

__Examples__
```js
// write ndef
NfcManager.requestNdefWrite(bytes)
    .then(() => console.log('write completed'))
    .catch(err => console.warn(err))

// request ndef formating (first argument can be null in this case)
NfcManager.requestNdefWrite(null, {format: true})
    .then(() => console.log('format completed'))
    .catch(err => console.warn(err))
```

### cancelNdefWrite() [Android only]
Cancel the pending ndef writing operation.

### onStateChanged(listener) [Android only]
Listen to NFC state change (on/off/turning_on/turning_off)

__Arguments__
- `listener` - `function` - the callback when NFC state changed

__Examples__
```js
NfcManager.onStateChanged(
    event => {
        if (event.state === 'on') {
            // do whatever you want
        } else if (event.state === 'off') {
            // do whatever you want
        } else if (event.state === 'turning_on') {
            // do whatever you want
        } else if (event.state === 'turning_off') {
            // do whatever you want
        }
    }
)
    .then(sub => {
        this._stateChangedSub = sub; 
        // remember to call this._stateChangedSub.remove()
        // when you don't want to listen to this anymore
    })
    .catch(err => {
        console.warn(err);
    })
```

### requestTechnology(tech) [Android only]
Request specific NFC Technology to perform advanced actions. 
- Please refer to [Android Advanced NFC Guide](https://stuff.mit.edu/afs/sipb/project/android/docs/guide/topics/connectivity/nfc/advanced-nfc.html) to understand what a `NFC Technology` means.

> This method returns a promise:
> * if resolved, it means you already find and connect to the tag supporting the requested technology, so the technology specific API can be called. 
> * if rejected, it means either the request is cancelled or the discovered tag doesn't support the requested technology.

Notice you must call `registerTagEvent` first before calling this. 

__Arguments__
- `tech` - `string` - the NFC Technology you want to use 
    - the available ones are defined in `NfcTech` (please do `import {NfcTech} from 'react-native-nfc-manager`) 

__Examples__
> Concrete examples using NFC Technology can be found in `example/AndroidTechTestNdef.js` and `example/AndroidMifareClassic.js`

### cancelTechnologyRequest() [Android only]
Cancel previous NFC Technology request. 

### closeTechnology() [Android only]
When all your NFC Technology operations are finished, you should call this API to disconnect from the tag and release resources.

### setNdefPushMessage(bytes) [Android only]
This API triggers [**Android Beam**](https://developer.android.com/guide/topics/connectivity/nfc/nfc#p2p), it can send Ndef (constructed by `bytes` array you passed) to remote device.
Notice you must call `registerTagEvent` first before calling this. 

> When you want to cancel the Ndef sending, simply call this API again and pass `null` to it.

__Arguments__
- `bytes` - `array` - the full NdefMessage, which is an array of number

__Examples__

> Please see `examples/App.js` for a concrete example

```js
// register Android Beam 
NfcManager.setNdefPushMessage(bytes)
    .then(() => console.log('ready to beam'))
    .catch(err => console.warn(err))

// cancel Android Beam
NfcManager.setNdefPushMessage(null)
    .then(() => console.log('beam cancelled'))
    .catch(err => console.warn(err))
```

## Ndef API 

This module is integrated from [`ndef-js`](https://github.com/don/ndef-js) to perform Ndef encoding & decoding. Great thanks for their brilliant work!

We mainly remove the dependency to NodeJS `Buffer` and maintain most of the original structure.

### Encode example:

```js
let bytes = Ndef.encodeMessage([
    Ndef.textRecord("hello, world"),
    Ndef.uriRecord("http://nodejs.org"),
]);

// then you can pass `bytes` into API such as NfcManager.requestNdefWrite()
```

### Decode example:

```js
_onTagDiscovered = tag => {
    console.log('Tag Discovered', tag);
    this.setState({ tag });

    let parsed = null;
    if (tag.ndefMessage && tag.ndefMessage.length > 0) {
        // ndefMessage is actually an array of NdefRecords, 
        // and we can iterate through each NdefRecord, decode its payload 
        // according to its TNF & type
        const ndefRecords = tag.ndefMessage;

        function decodeNdefRecord(record) {
            if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_TEXT)) {
                return ['text', Ndef.text.decodePayload(record.payload)];
            } else if (Ndef.isType(record, Ndef.TNF_WELL_KNOWN, Ndef.RTD_URI)) {
                return ['uri', Ndef.uri.decodePayload(record.payload)];
            }

            return ['unknown', '---']
        }

        parsed = ndefRecords.map(decodeNdefRecord);
    }

    this.setState({parsed});
}
```
## NfcTech.Ndef API [Android only]

To use the NfcTech.Ndef API, you first need to request the `NfcTech.Ndef` technology (see `requestTechnology`). Once you have the tech request, you can use the following methods:

### writeNdefMessage(bytes) [Android only]
Request writing **NdefMessage** (constructed by `bytes` array you passed) into the tag.

> This method returns a promise:
> * if resolved, it means you successfully write NdefMessage to the tag.
> * if rejected, it means either the request is cancelled, the write operation fail or the operation is not supported in current tech handle.

__Arguments__
- `bytes` - `array` - the full NdefMessage, which is an array of bytes

### getNdefMessage() [Android only]
Read current NdefMessage inside the tag.

> This method returns a promise:
> * if resolved, the resolved value will be a tag object, which should contain a `ndefMessage` property.
> * if rejected, it means either the request is cancelled, the read operation fail or the operation is not supported in current tech handle.

### getCachedNdefMessage() [Android only]
Read cached NdefMessage inside the tag, no further IO operation occurs.

> This method returns a promise:
> * if resolved, the resolved value will be a tag object, which should contain a `ndefMessage` property.
> * if rejected, it means either the request is cancelled or the operation is not supported in current tech handle.

### makeReadOnly() [Android only]
Make the tag become read-only.

> This method returns a promise:
> * if resolved, the operation success and tag should become read-only.
> * if rejected, it means either the request is cancelled, the operation fail or the operation is not supported in current tech handle.

## Generic NfcTech API [Android only]

To use the these API, you first need to request specific NFC technology (see `requestTechnology`). Once you have the tech request, you can use the following methods:

### transceive(bytes) [Android only]
Send raw data to a tag and receive the response. This API is compatible with following NfcTech: NfcA, NfcB, NfcF, NfcV, IsoDep and MifareUltralight.

> This method returns a promise:
> * if resolved, it means you successfully send data to the tag, and the resolved value will the response, which is also an `array of bytes`.
> * if rejected, it means either the request is cancelled, the operation fail or the operation is not supported in current tech handle.

__Arguments__
- `bytes` - `array` - the raw data you want to send, which is an array of bytes

### getMaxTransceiveLength() [Android only]
Return the maximum number of bytes that can be sent. This API is compatible with following NfcTech: NfcA, NfcB, NfcF, NfcV, IsoDep and MifareUltralight.

> This method returns a promise:
> * if resolved, the resolved value will be the maximum number of bytes that can be sent to transceive.
> * if rejected, it means either the request is cancelled, the operation fail or the operation is not supported in current tech handle.

### setTimeout(timeout) [Android only]
Set the transceive timeout in milliseconds. This API is compatible with following NfcTech: NfcA, NfcF, IsoDep, MifareClassic and MifareUltralight.

> This method returns a promise:
> * if resolved, it means the setTimeout operation is success.
> * if rejected, it means either the request is cancelled, the operation fail or the operation is not supported in current tech handle.

__Arguments__
- `timeout` - `int` - the transceive timeout in milliseconds


## NfcTech.MifareClassic API [Android only]

This module enables you to read encrypted [Mifare Classic](https://en.wikipedia.org/wiki/MIFARE#MIFARE_Classic_family) cards (as long as you have the authentication keys). A concrete example can be found in `example/AndroidMifareClassic.js`

To find more information about the low level APIs of Mifare Classic on Android checkout this excellent blog post: [MiFare Classic Detection on Android](http://mifareclassicdetectiononandroid.blogspot.com/2011/04/reading-mifare-classic-1k-from-android.html)

At the time of writing, iOS 12 still doesn't support any Mifare cards, or any NFC technology that doesn't use the NDEF standards.

To use the Mifare Classic API, you first need to request the `NfcTech.MifareClassic` technology (see `requestTechnology`). Once you have the tech request, you can use the following methods to interact with the Mifare Classic cards:

### mifareClassicAuthenticateA(sector, key) and mifareClassicAuthenticateB(sector, key) [Android only]
Authenticate to the Mifare Classic card using key A or key B.

> This method returns a promise:
> * if resolved, it means you successfully authenticated to the Mifare Classic card, and a read request can be called.
> * if rejected, it means either the request is cancelled, the discovered card doesn't support the requested technology or the authentication simply failed. The returned error should give you some insights about what went wrong.

Notice you must have successfully requested the Mifare Classic technology with the `requestTechnology` call before using this method.

__Arguments__
- `sector` - `number` - the Mifare Classic sector to authenticate to (e.g. 0 - 15 for Mifare Classic 1K cards)
- `key` - `byte[]` - an array of bytes (numbers) that contains the key

__Examples__
> A concrete example using Mifare Classic can be found in `example/AndroidMifareClassic.js`
```js
NfcManager.mifareClassicAuthenticateA(0, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]).then(() => {
  /* ...do your stuff here... */
});
```

### mifareClassicGetBlockCountInSector(sector) [Android only]
Returns a promise with the number of blocks in a given sector.

Note: because the block count and sector count can vary from card to card, the card must be successfully detected by the `NfcManager.requestTechnology(NfcTech.MifareClassic)` callback first before calling this method. Does not cause any RF activity and does not block.

__Arguments__
- `sector` - `number` - the Mifare Classic sector to get the number of blocks from (the number of blocks might depend on the detected card type)

__Return value__
- `blocks` - `number` - the number of blocks

### mifareClassicGetSectorCount() [Android only]
Returns a promise with the number of sectors on the card.

Note: because the sector count can vary from card to card, the card must be successfully detected by the `NfcManager.requestTechnology(NfcTech.MifareClassic)` callback first before calling this method. Does not cause any RF activity and does not block.

__Return value__
- `sectors` - `number` - the number of sectors

### mifareClassicSectorToBlock(sector) [Android only]
Returns a promise with the blockIndex for a given sector.

Note: because the block count and sector count can vary from card to card, the card must be successfully detected by the `NfcManager.requestTechnology(NfcTech.MifareClassic)` callback first before calling this method. Does not cause any RF activity and does not block.

__Arguments__
- `sector` - `number` - the Mifare Classic sector to get the blockIndex from (the number of blocks might depend on the detected card type)

__Return value__
- `blockIndex` - `number` - the block index of the sector

### mifareClassicReadBlock(block) and mifareClassicReadSector(sector) [Android only]
Reads a block/sector from a Mifare Classic card. You must be authenticated according to the card's configuration, or this promise will be rejected with `mifareClassicReadBlock fail: java.io.IOException: Transceive failed`.

The difference between readBlock and readSector is that readBlock will only read one block, while readSector will first get the blockIndex of the specified sector, and will read as many blocks as there are in the specified sector. It's generally speaking faster than calling `mifareClassicGetBlockCountInSector` yourself and doing consecutive reads yourself.

> This method returns a promise:
> * if resolved, it returns the data (array of bytes (numbers)) from the specified block/sector.
> * if rejected, it means either the request is cancelled, the discovered card doesn't support the requested technology, the authentication failed or something else went wrong. The returned error should give you some insights about what went wrong.

Notice you must be successfully authenticated with the `mifareClassicAuthenticateA` or `mifareClassicAuthenticateB` call before using this method.

__Arguments__
- `block/sector` - `number` - the Mifare Classic block/sector to read (the number of blocks/sector might depend on the detected card type)

__Return value__
- `data` - `byte[]` - an array of bytes (numbers)

For convenience, a class `ByteParser` is included in the NfcManager exports. This class contains 2 methods `byteToHexString` and `byteToString` who can be used to get the raw data into a hex string or a string, depending on what data is stored on the card.

__Examples__
> A concrete example using Mifare Classic can be found in `example/AndroidMifareClassic.js`
```js
NfcManager.mifareClassicReadBlock(0).then((message) => {
  const str = ByteParser.byteToString(message);
  /* ...do your stuff here... */
});
```

#### Read authenticated example:

The following is some wrapper code that uses the `async/await` syntax.

```js
const readAuthenticatedA = async (sector, code) => {
  return new Promise((resolve, reject) => {
    NfcManager.mifareClassicAuthenticateA(sector, code)
      .then(() => {
        console.log(`mifareClassicAuthenticateA(${sector}) completed`);
        NfcManager.mifareClassicReadSector(sector)
          .then(data => {
            console.log(`mifareClassicReadSector(${sector}) completed`);
            resolve(data);
          })
          .catch(err => {
            console.log(`mifareClassicReadSector(${sector}) failed:`, err);
            reject(err);
          });
      })
      .catch(err => {
        console.log(`mifareClassicAuthenticateA(${sector}) failed:`, err);
        reject(err);
      });
  });
};

const sector0Data = await readAuthenticatedA(0, [0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF]);
```

### mifareClassicWriteBlock(block, data) [Android only]
Writes a block to a Mifare Classic card. You must be authenticated according to the card's configuration, or this promise will be rejected with `mifareClassicWriteBlock fail: java.io.IOException: Transceive failed`.

To write a full sector, you must first get the blockIndex of the specified sector by calling `mifareClassicSectorToBlock` and write all the blocks in the sector (`mifareClassicGetBlockCountInSector` times).

> This method returns a promise:
> * if resolved, it returns true.
> * if rejected, it means either the request is cancelled, the discovered card doesn't support the requested technology, the authentication failed or something else went wrong. The returned error should give you some insights about what went wrong.

Notice you must be successfully authenticated with the `mifareClassicAuthenticateA` or `mifareClassicAuthenticateB` call before using this method.

__Arguments__
- `block` - `number` - the Mifare Classic block to write (the number of blocks/sector might depend on the detected card type)
- `data` - `byte[]` - an array of bytes (numbers) with length of `NfcManager.MIFARE_BLOCK_SIZE`

__Examples__
> A concrete example using Mifare Classic can be found in `example/AndroidMifareClassic.js`
```js
NfcManager.mifareClassicWriteBlock(0, [ 72, 101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 33, 0, 0, 0 ]).then(() => {
  console.log('Wrote "Hello, world!" to the card');
});
```

## NfcTech.MifareUltralight API [Android only]

To use the NfcTech.MifareUltralight API, you first need to request the `NfcTech.MifareUltralight` technology (see `requestTechnology`). Once you have the tech request, you can use the following methods:

### mifareUltralightReadPages(pageOffset) [Android only]
Read 4 pages (16 bytes).

> This method returns a promise:
> * if resolved, the resolved value will be the 16 bytes page data.
> * if rejected, it means either the request is cancelled, the write operation fail or the operation is not supported in current tech handle.

__Arguments__
- `pageOffset` - `number` - index of first page to read, starting from 0 

### mifareUltralightWritePage(pageOffset, bytes) [Android only]
Write 1 pages (4 bytes).

> This method returns a promise:
> * if resolved, it means the write operation is completed.
> * if rejected, it means either the request is cancelled, the write operation fail or the operation is not supported in current tech handle.

__Arguments__
- `pageOffset` - `number` - index of first page to read, starting from 0 
- `bytes` - `array` - 4 bytes to write 

## ByteParser API 
Simple utility for working with byte[] arrays like in Mifare Classic cards)

### byteToHexString(bytes)
Converts a byte array `byte[]` to a hex string.

__Arguments__
- `bytes` - `byte[]` - the result of a mifareClassicReadBlock call.

__Examples__
```js
let hexString = ByteParser.byteToHexString(result);
console.log('hex string: ' + hexString);
```

### byteToString(bytes)
Converts a byte array `byte[]` to a string (if the data represents an ASCII string).

__Arguments__
- `bytes` - `byte[]` - the result of a mifareClassicReadBlock call.

__Examples__
```js
let str = ByteParser.byteToString(result);
console.log('string: ' + str);
```

## NFC Hardware requirement on Android

By default react-native-nfc-manager is set to not require NFC hardware on Android. This setting will overwrite what ever you put in your main AndroidManifest.xml file during `react-native link` phase.

If you want to change this behavior to only have your app support NFC devices you have to override you app manifest manually.

Current setting is:
```<uses-feature android:name="android.hardware.nfc" android:required="false" />```

If you want to only have your app support NFC devices then you have to change required to true.


## Version history (from v0.1.0) 

v1.2.0
- support Android `readerMode` feature (limit the NFC controller to reader mode only)

v1.1.0
- support Mifare Ultralight 

v1.0.0
- support Mifare Classic write operation (thanks to @poison)
- refactor Mifare Classic read operation to distinguish from `sector` and `block` (thanks for @poison)
- basic support for NfcF, NfcV, IsoDep with `transceive` method

v0.7.0
- basic support for Mifare Classic (thanks to @poison)
    - see `example/AndroidMifareClassic.js` for a full example.

v0.6.0
- integrate [`ndef-js`](https://github.com/don/ndef-js) to perform Ndef encoding & decoding. Great thanks for their brilliant work!
- as a result of previous integration, users can now easily handle the NdefMessage consists of multi NdefRecords. 
    - see `example/MultiNdefRecord.js` for a full example to write or read such an NdefMessage.

v0.5.4
- (android) support `getTag` for all NFC technologies
- (android) update **compileSdkVersion** and **buildToolsVersion** to 26
- (ios) bug fix: clear event subscription when reader session closed

v0.5.2
- support **Android Beam** via `setNdefPushMessage` API [Android only]
    - please see `examples/App.js` for a concrete example
- new methods for `NfcTech.Ndef` [Android only]
    - supported methods: `makeReadOnly`
- bug fix: guard against getCurrentActivity() returns null

v0.5.1
- support `NfcTech.NfcA` [Android only]:
    - representing `android.nfc.tech.NfcA` [link](https://developer.android.com/reference/android/nfc/tech/NfcA)
    - supported methods: `transceive`

v0.5.0
- support `NfcTech.Ndef` [Android only]:
    - representing `android.nfc.tech.Ndef` [link](https://developer.android.com/reference/android/nfc/tech/Ndef)
    - supported methods: `writeNdefMessage`, `getNdefMessage`, `getCachedNdefMessage`
    - please see `examples/AndroidTechTestNdef.js` for a concrete example

v0.4.0
- support `NdefParser.parseText` for RTD_TEXT parsing 

v0.3.2
- change `isSupported` API to utilize `NFCNDEFReaderSession.readingAvailable` [iOS]
- change minSdkVersion to 16 [Android]

v0.3.0
- add `onStateChanged` [Android] 
- add options for `requestNdefWrite` to allow NDEF formating [Android]

v0.2.0
- add `requestNdefWrite` and `cancelNdefWrite` [Android] 

v0.1.0
- add `isNfcSupported` 

## Deprecated API

<details>
<summary>
NdefParser
</summary>

## NdefParser API (deprecated, please use `Ndef` instead)

### parseUri(ndef)
Try to parse RTD_URI from a NdefMessage, return an object with an `uri` property.

__Arguments__
- `ndef` - `object` - this object should be obtained from nfc tag object with this form: `tag.ndefMessage[0]`. (NFC tag object can be obtained by `getLaunchTagEvent` or `registerTagEvent`)

__Examples__
```js
let {uri} = NdefParser.parseUri(sampleTag.ndefMessage[0]);
console.log('parseUri: ' + uri);
```

### parseText(ndef)
Try to parse RTD_TEXT from a NdefMessage, return parsed string or null if the operation fail. Currently only support utf8.

__Arguments__
- `ndef` - `object` - this object should be obtained from nfc tag object with this form: `tag.ndefMessage[0]`. (NFC tag object can be obtained by `getLaunchTagEvent` or `registerTagEvent`)

__Examples__
```js
let text = NdefParser.parseText(sampleTag.ndefMessage[0]);
console.log('parsedText: ' + text);
```

</details>

