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
      mode: 'read',
      keyAorB: KeyTypes[1], // 'B'
      keyToUse: 'FFFFFFFFFFFF',
      sector: 0,
      tag: null,
      sectorCount: null,
      blocksInSector: null,
      parsedText: null,
      firstBlockInSector: null,
      textToWrite: 'Hello, world!',
    };
  }

  componentDidMount() {
    NfcManager.isSupported(NfcTech.MifareClassic).then(supported => {
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
      sectorCount,
      blocksInSector,
      parsedText,
      firstBlockInSector,
      textToWrite,
    } = this.state;

    return (
      <ScrollView style={{ flex: 1 }}>
        {Platform.OS === 'ios' && <View style={{ height: 60 }} />}

        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
        >
          <Text>{`Is MifareClassic supported ? ${supported}`}</Text>
          <Text>{`Is NFC enabled (Android only)? ${enabled}`}</Text>

          {!isDetecting && (
            <TouchableOpacity
              style={{ margin: 10 }}
              onPress={() => this._startDetection()}
            >
              <Text
                style={{ color: 'blue', textAlign: 'center', fontSize: 20 }}
              >
                {`CLICK TO START DETECTING ${this.state.mode === 'read' ? 'READ' : 'WRITE'}`}
              </Text>
            </TouchableOpacity>
          )}

          {isDetecting && (
            <TouchableOpacity
              style={{ margin: 10 }}
              onPress={() => this._stopDetection()}
            >
              <Text style={{ color: 'red', textAlign: 'center', fontSize: 20 }}>
                {`CLICK TO STOP DETECTING ${this.state.mode === 'read' ? 'READ' : 'WRITE'}`}
              </Text>
            </TouchableOpacity>
          )}

          {
            <View
              style={{ padding: 10, marginTop: 20, backgroundColor: '#e0e0e0' }}
            >
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={[{ flex: 1, alignItems: 'center' }, this.state.mode === 'read' ? {backgroundColor: '#cc0000'} : {backgroundColor: '#d0d0d0'}]}
                  onPress={() => this.setState({
                    tag: null,
                    mode: 'read',
                    sectorCount: null,
                    blocksInSector: null,
                    parsedText: null,
                    firstBlockInSector: null,
                  })}
                >
                  <Text>READ</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[{ flex: 1, alignItems: 'center' }, this.state.mode !== 'read' ? {backgroundColor: '#cc0000'} : {backgroundColor: '#d0d0d0'}]}
                  onPress={() => this.setState({
                    tag: null,
                    mode: 'write',
                    sectorCount: null,
                    blocksInSector: null,
                    parsedText: null,
                    firstBlockInSector: null,
                  })}
                >
                  <Text>WRITE</Text>
                </TouchableOpacity>
              </View>
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
                  onChangeText={sector => this.setState({ sector: sector })}
                />
              </View>
              {this.state.mode !== 'read' && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ marginRight: 15 }}>Text to write:</Text>
                  <TextInput
                    style={{ width: 200 }}
                    value={textToWrite}
                    onChangeText={textToWrite => this.setState({ textToWrite })}
                  />
                </View>
              )}
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
              tag ? `${JSON.stringify(tag)} (${sectorCount} sectors)` : '---'
            }`}</Text>
            {parsedText && (
              <Text
                style={{ marginTop: 5 }}
              >{`Parsed Text:\n${parsedText}`}</Text>
            )}
            {firstBlockInSector && (
              <Text
                style={{ marginTop: 5 }}
              >{`First block in sector:\n${firstBlockInSector} [${blocksInSector} blocks]`}</Text>
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

    const read = () => {
      return NfcManager.mifareClassicGetBlockCountInSector(parseInt(this.state.sector))
        .then(blocksInSector => {
          this.setState({ blocksInSector });
        })
        .then(() =>
          NfcManager.mifareClassicReadSector(parseInt(this.state.sector)),
        )
        .then(tag => {
          let parsedText = ByteParser.byteToHexString(tag);
          this.setState({ parsedText });
        })
        .then(() =>
          NfcManager.mifareClassicSectorToBlock(parseInt(this.state.sector)),
        )
        .then(block => NfcManager.mifareClassicReadBlock(block))
        .then(data => {
          const parsedText = ByteParser.byteToString(data);
          this.setState({ firstBlockInSector: parsedText });
        })
    };

    const write = () => {
      return NfcManager.mifareClassicSectorToBlock(parseInt(this.state.sector))
        .then(block => {
          // Create 1 block
          let data = [];
          for (let i = 0; i < NfcManager.MIFARE_BLOCK_SIZE; i++) {
            data.push(0);
          }

          // Fill the block with our text, but don't exceed the block size
          for (let i = 0; i < this.state.textToWrite.length && i < NfcManager.MIFARE_BLOCK_SIZE; i++) {
            data[i] = parseInt(this.state.textToWrite.charCodeAt(i));
          }

          return NfcManager.mifareClassicWriteBlock(block, data);
        })
        .then(read)
    };

    this.setState({ isDetecting: true });
    NfcManager.registerTagEvent(tag => console.log(tag))
      .then(() => NfcManager.requestTechnology(NfcTech.MifareClassic))
      .then(() => NfcManager.getTag())
      .then(tag => {
        this.setState({ tag });
        return NfcManager.mifareClassicGetSectorCount();
      })
      .then(sectorCount => {
        this.setState({ sectorCount });
      })
      .then(() => {
        let sector = parseInt(this.state.sector);
        if (isNaN(sector)) {
          this.setState({ sector: '0' });
          sector = 0;
        }

        // Convert the key to a UInt8Array
        const key = [];
        for (let i = 0; i < this.state.keyToUse.length - 1; i += 2) {
          key.push(parseInt(this.state.keyToUse.substring(i, i + 2), 16));
        }

        if (this.state.keyAorB === KeyTypes[0]) {
          return NfcManager.mifareClassicAuthenticateA(sector, key);
        } else {
          return NfcManager.mifareClassicAuthenticateB(sector, key);
        }
      })
      .then(() => { return this.state.mode === 'read' ? read() : write() })
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
    this.setState({
      tag: null,
      sectorCount: null,
      blocksInSector: null,
      parsedText: null,
      firstBlockInSector: null,
    });
  };
}

export default App;
