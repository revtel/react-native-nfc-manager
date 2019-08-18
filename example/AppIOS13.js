import React from 'react';
import {
    View,
    Text,
    Button,
    Platform,
    TouchableOpacity,
    Linking,
    TextInput,
    ScrollView,
} from 'react-native';
import NfcManager, {Ndef} from '../NfcManager';

class AppIOS13 extends React.Component {
  componentDidMount() {
    NfcManager.start();
  }

  componentWillUnmount() {
    this._cleanUp();
  }

  render() {
    return (
      <View style={{padding: 20}}>
        <Text>NFC Demo on iOS13</Text>
        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={this._testMifare}
        >
          <Text>Test Mifare</Text>
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
    NfcManager.unregisterTagEventEx().catch(() => 0);    
  }

  _testMifare = async () => {
    try {
      await NfcManager.registerTagEventEx()
      let resp = await NfcManager.requestTechnology('mifare');
      console.warn(resp);
      let tag = await NfcManager.getTag();
      console.warn(tag);
      this._cleanUp();
    } catch (ex) {
      this._cleanUp();
    }
  }
}

export default AppIOS13;