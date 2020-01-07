import React from 'react';
import { 
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import AppV2 from './AppV2';
import AppV2Ndef from './AppV2Ndef';
import AppV2Mifare from './AppV2Mifare';
import AppV2Apdu from './AppV2Apdu';
import AppV2Iso15693 from './AppV2Iso15693';

class AppIndexV2 extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedDemo: null
    }
  }

  render() {
    let {selectedDemo} = this.state;

    if (selectedDemo === 'tag-event') {
      return (
        <AppV2 />
      )
    } else if (selectedDemo === 'ndef') {
      return (
        <AppV2Ndef />
      )
    } else if (selectedDemo === 'mifare') {
      return (
        <AppV2Mifare />
      )
    } else if (selectedDemo === 'iso-dep') {
      return (
        <AppV2Apdu />
      )
    } else if (selectedDemo === 'iso-15693') {
      return (
        <AppV2Iso15693 />
      )
    }

    return (
      <View style={{padding: 20}}>
        <Text>NFC Demo</Text>

        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={() => this.setState({selectedDemo: 'tag-event'})}
        >
          <Text>Listen To Tag</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={() => this.setState({selectedDemo: 'ndef'})}
        >
          <Text>NDEF tech</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={() => this.setState({selectedDemo: 'mifare'})}
        >
          <Text>Mifare tech</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
          onPress={() => this.setState({selectedDemo: 'iso-dep'})}
        >
          <Text>IsoDep tech</Text>
        </TouchableOpacity>

        {Platform.OS === 'ios' && (
          <TouchableOpacity 
            style={{padding: 10, width: 200, margin: 20, borderWidth: 1, borderColor: 'black'}}
            onPress={() => this.setState({selectedDemo: 'iso-15693'})}
          >
            <Text>(iOS) Iso15693 tech</Text>
          </TouchableOpacity>
        )}
      </View>
    )
  }
}

export default AppIndexV2;