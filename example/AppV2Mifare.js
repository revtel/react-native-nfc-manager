import React from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import NfcManager, {NfcTech} from '../NfcManager';

class AppV2Mifare extends React.Component {
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
          onPress={this._test}
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
  }

  _test = async () => {
    try {
      let tech = Platform.OS === 'ios' ? NfcTech.MifareIOS : NfcTech.NfcA;
      let resp = await NfcManager.requestTechnology(tech, {
        alertMessage: 'Ready to do some custom Mifare cmd!'
      });
      console.warn(resp);

      // the NFC uid can be found in tag.id
      let tag = await NfcManager.getTag();
      console.warn(tag);

      if (Platform.OS === 'ios') {
        resp = await NfcManager.sendMifareCommandIOS([0x30, 0x00]);
      } else {
        resp = await NfcManager.transceive([0x30, 0x00]);
      }
      console.warn(resp);

      this._cleanUp();
    } catch (ex) {
      console.warn('ex', ex);
      this._cleanUp();
    }
  }
}

export default AppV2Mifare;