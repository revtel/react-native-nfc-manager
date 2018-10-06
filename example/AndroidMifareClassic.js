import React, { Component } from 'react';
import {
  View,
  Text,
  Platform,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import NfcManager, { ByteParser, NfcTech } from 'react-native-nfc-manager';

const KeyTypes = ['A', 'B'];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      supported: false,
      enabled: false,
      isDetecting: false,
      keyAorB: KeyTypes[1], // 'B'
      keyToUse: 'FFFFFFFFFFFF',
      sector: 0,
      tag: {},
      parsedText: null,
    };
  }

  componentDidMount() {
    NfcManager.isSupported().then(supported => {
      this.setState({ supported });
      if (supported) {
        this._startNfc();
      }
    });
  }

  componentWillUnmount() {
    if (this._stateChangedSubscription) {
      this._stateChangedSubscription.remove();
    }
  }

  render() {
    let {
      supported,
      enabled,
      isDetecting,
      keyAorB,
      keyToUse,
      sector,
      tag,
      parsedText,
    } = this.state;

    return (
      <ScrollView style={{ flex: 1 }}>
        {Platform.OS === 'ios' && <View style={{ height: 60 }} />}

        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>{`Is NFC supported ? ${supported}`}</Text>
          <Text>{`Is NFC enabled (Android only)? ${enabled}`}</Text>

          {!isDetecting && (
            <TouchableOpacity
              style={{ margin: 10 }}
              onPress={() => this._startDetection()}
            >
              <Text
                style={{ color: 'blue', textAlign: 'center', fontSize: 20 }}
              >
                CLICK TO START DETECTING
              </Text>
            </TouchableOpacity>
          )}

          {isDetecting && (
            <TouchableOpacity
              style={{ margin: 10 }}
              onPress={() => this._stopDetection()}
            >
              <Text style={{ color: 'red', textAlign: 'center', fontSize: 20 }}>
                CLICK TO STOP DETECTING
              </Text>
            </TouchableOpacity>
          )}

          {
            <View
              style={{ padding: 10, marginTop: 20, backgroundColor: '#e0e0e0' }}
            >
              <Text>(android) Read MiFare Classic Test</Text>
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <Text style={{ marginRight: 33 }}>Key to use:</Text>
                {KeyTypes.map(key => (
                  <TouchableOpacity
                    key={key}
                    style={{ marginRight: 10 }}
                    onPress={() => this.setState({ keyAorB: key })}
                  >
                    <Text style={{ color: keyAorB === key ? 'blue' : '#aaa' }}>
                      Use key {key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ marginRight: 35 }}>Key (hex):</Text>
                <TextInput
                  style={{ width: 200 }}
                  value={keyToUse}
                  onChangeText={keyToUse => this.setState({ keyToUse })}
                />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ marginRight: 10 }}>Sector (0-15):</Text>
                <TextInput
                  style={{ width: 200 }}
                  value={sector.toString(10)}
                  onChangeText={sector =>
                    this.setState({ sector: parseInt(sector, 10) })
                  }
                />
              </View>
            </View>
          }

          <View
            style={{
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              marginTop: 20,
            }}
          >
            <Text>{`Original tag content:`}</Text>
            <Text style={{ marginTop: 5, color: 'grey' }}>{`${
              tag ? JSON.stringify(tag) : '---'
            }`}</Text>
            {parsedText && (
              <Text
                style={{ marginTop: 5 }}
              >{`(Parsed Text: ${parsedText})`}</Text>
            )}
          </View>

          <TouchableOpacity
            style={{ marginTop: 20, alignItems: 'center' }}
            onPress={this._clearMessages}
          >
            <Text style={{ color: 'blue' }}>Clear above message</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  _startDetection = () => {
    const cleanUp = () => {
      this.setState({ isDetecting: false });
      NfcManager.closeTechnology();
      NfcManager.unregisterTagEvent();
    };

    this.setState({ isDetecting: true });
    NfcManager.registerTagEvent(tag => console.log(tag))
      .then(() => NfcManager.requestTechnology(NfcTech.MifareClassic))
      .then(() => NfcManager.getTag())
      .then(tag => {
        this.setState({ tag });
      })
      .then(() => {
        // Convert the key to a UInt8Array
        const key = [];
        for (let i = 0; i < this.state.keyToUse.length - 1; i += 2) {
          key.push(parseInt(this.state.keyToUse.substring(i, i + 2), 16));
        }

        if (this.state.keyAOrB === KeyTypes[0]) {
          return NfcManager.mifareClassicAuthenticateA(this.state.sector, key);
        } else {
          return NfcManager.mifareClassicAuthenticateB(this.state.sector, key);
        }
      })
      .then(() => NfcManager.mifareClassicReadBlock(this.state.sector))
      .then(tag => {
        let parsedText = ByteParser.byteToHexString(tag);
        this.setState({ parsedText });
      })
      .then(cleanUp)
      .catch(err => {
        console.warn(err);
        cleanUp();
      });
  };

  _stopDetection = () => {
    NfcManager.cancelTechnologyRequest()
      .then(() => this.setState({ isDetecting: false }))
      .catch(err => console.warn(err));
  };

  _startNfc = () => {
    NfcManager.start()
      .then(() => NfcManager.isEnabled())
      .then(enabled => this.setState({ enabled }))
      .catch(err => {
        console.warn(err);
        this.setState({ enabled: false });
      });
  };

  _clearMessages = () => {
    this.setState({ tag: null, parsedText: null });
  };
}

export default App;
