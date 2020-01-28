import React from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import NfcManager, {NfcTech, Nfc15693RequestFlagIOS} from '../NfcManager';

class AppV2Iso15693 extends React.Component {
  componentDidMount() {
    NfcManager.start();
  }

  componentWillUnmount() {
    this._cleanUp();
  }

  render() {
    if (Platform.OS === 'android') {
      console.warn('Please use NfcTech.NfcV and "transceive" method for Android');
      return null;
    }

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
      let tech = NfcTech.Iso15693IOS;
      let resp = await NfcManager.requestTechnology(tech, {
        alertMessage: 'Ready to scan tag'
      });
      console.warn(resp);

      let tag = await NfcManager.getTag();
      console.warn(tag);

      const handler = NfcManager.getIso15693HandlerIOS();

      resp = await handler.getSystemInfo(Nfc15693RequestFlagIOS.HighDataRate);
      console.warn(resp);

      await handler.writeSingleBlock({
        flags: Nfc15693RequestFlagIOS.HighDataRate,
        blockNumber: 0,
        dataBlock: [4, 3, 2, 1]
      });

      resp = await handler.readSingleBlock({
        flags: Nfc15693RequestFlagIOS.HighDataRate,
        blockNumber: 0,
      });
      console.warn(resp);

      this._cleanUp();
    } catch (ex) {
      console.warn('ex', ex);
      this._cleanUp();
    }
  }
}

export default AppV2Iso15693;
