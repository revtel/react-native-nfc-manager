## API v2

In v2, we seperate the API to 2 different usage:
* **basic usage**: only reading NDEF tags
* **advanced usage**: use different NFC technologies to perform specific tasks

### Basic usage
For **basic** case, the main API you need will be:
* `registerTagEvent`, to enable NFC tag reading functionality
* `setEventListener`, to listen to the discovered tags and the NdefMessage within them
* `unregisterTagEvent`

> For V1 users, please notice we no longer accept passing callback into `registerTagEvent`, so you will need to use `setEventListener` for `NfcEvents.DiscoverTag` explicitly

Here is an example, work for both iOS & Android:

```javascript
import React from 'react'
import {
  View, Text, TouchableOpacity
} from 'react-native'
import NfcManager, {NfcEvents} from 'react-native-nfc-manager';

class AppV2 extends React.Component {
  componentDidMount() {
    NfcManager.start();
    NfcManager.setEventListener(NfcEvents.DiscoverTag, tag => {
      console.warn('tag', tag);
      NfcManager.setAlertMessageIOS('I got your tag!');
      NfcManager.unregisterTagEvent().catch(() => 0);
    });
  }

  componentWillUnmount() {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
    NfcManager.unregisterTagEvent().catch(() => 0);
  }

  render() {
    return (
      <View style={{padding: 20}}>
        <Text>NFC Demo</Text>
        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={this._test}
        >
          <Text>Test</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={this._cancel}
        >
          <Text>Cancel Test</Text>
        </TouchableOpacity>
      </View>
    )
  }

  _cancel = () => {
    NfcManager.unregisterTagEvent().catch(() => 0);
  }

  _test = async () => {
    try {
      await NfcManager.registerTagEvent();
    } catch (ex) {
      console.warn('ex', ex);
      NfcManager.unregisterTagEvent().catch(() => 0);
    }
  }
}

```

## Advanced usage

In order to use specific NFC technology to perform specific tasks, two steps are required:
* `requestTechnology`, pass your desired NFC tech to this API, and it will return a promise which resolves when the desired tag is found
* After the tag with desired tech is found, use tech speicific API to perform your tasks
* once you're done, call `cancelTechnologyRequest` to ask native platform to stop NFC tag scanning.

> For V1 users, please notice that you don't need to manually call `registerTagEvent` like before, we will do this for you as well as the clean up with `unregisterTagEvent`

A most common example is to write NdefMessage into a tag:

```javascript
import React from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import NfcManager, {Ndef, NfcEvents} from 'react-native-nfc-manager';

function buildUrlPayload(valueToWrite) {
    return Ndef.encodeMessage([
        Ndef.uriRecord(valueToWrite),
    ]);
}

class AppV2Ndef extends React.Component {
  componentDidMount() {
    NfcManager.start();
  }

  componentWillUnmount() {
    this._cleanUp();
  }

  render() {
    return (
      <View style={{padding: 20}}>
        <Text>NFC Demo</Text>
        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={this._testNdef}
        >
          <Text>Test Ndef</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={this._cleanUp}
        >
          <Text>Cancel Test</Text>
        </TouchableOpacity>
      </View>
    )
  }

  _cleanUp = () => {
    NfcManager.cancelTechnologyRequest().catch(() => 0);
  }

  _testNdef = async () => {
    try {
      let resp = await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: 'Ready to write some NFC tags!'
      });
      console.warn(resp);
      let ndef = await NfcManager.getNdefMessage();
      console.warn(ndef);
      let bytes = buildUrlPayload('https://www.revteltech.com');
      await NfcManager.writeNdefMessage(bytes);
      console.warn('successfully write ndef');
      await NfcManager.setAlertMessageIOS('I got your tag!');
      this._cleanUp();
    } catch (ex) {
      console.warn('ex', ex);
      this._cleanUp();
    }
  }
}

export default AppV2Ndef;
```

More examples can be found in `example` directory.