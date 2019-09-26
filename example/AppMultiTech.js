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
import NfcManager, {NfcTech} from '../NfcManager';

class AppMultiTech extends React.Component {
  componentDidMount() {
    NfcManager.start();
  }

  componentWillUnmount() {
    this._cleanUp();
  }

  render() {
    return (
      <View style={{padding: 20}}>
        <Text>NFC Multi-tech Demo</Text>
        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={this._testMultiTech}
        >
          <Text>Test</Text>
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
    NfcManager.unregisterTagEvent().catch(() => 0);    
  }

  _testMultiTech = async () => {
    try {
      await NfcManager.registerTagEvent()
      let resp = await NfcManager.requestTechnology([NfcTech.IsoDep, NfcTech.Ndef]);
      console.warn(resp);
      let tag = await NfcManager.getTag();
      console.warn(tag);
      this._cleanUp();
    } catch (ex) {
      this._cleanUp();
    }
  }
}

export default AppMultiTech;