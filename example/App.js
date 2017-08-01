import React, { Component } from 'react';
import {
    View,
    Text,
    Button,
    Platform,
    TouchableOpacity
} from 'react-native';
import NfcManager, {NdefParser} from 'react-native-nfc-manager';

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            enabled: false,
            tag: {},
        }
    }

    componentDidMount() {
        NfcManager.start()
            .then(result => {
                console.log('start OK', result);
            })
            .catch(error => {
                console.warn('start fail', error);
            })
        NfcManager.getLaunchTagEvent()
            .then(tag => {
                console.log('launch tag', tag);
                if (tag) {
                    this.setState({ tag });
                }
            })
        NfcManager.isEnabled()
            .then(enabled => {
                this.setState({ enabled });
            })
            .catch(err => {
                console.log(err);
            })
        this._testNdefParser();
    }

    render() {
        let { enabled, tag } = this.state;
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>{`Is NFC enabled ? ${enabled}`}</Text>

                <TouchableOpacity style={{ marginTop: 15 }} onPress={this._startDetection}>
                    <Text style={{ color: 'blue' }}>Start Tag Detection</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 15 }} onPress={this._stopDetection}>
                    <Text style={{ color: 'red' }}>Stop Tag Detection</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 15 }} onPress={this._clearMessages}>
                    <Text>Clear</Text>
                </TouchableOpacity>

                <TouchableOpacity style={{ marginTop: 15 }} onPress={this._goToNfcSetting}>
                    <Text >Go to NFC setting</Text>
                </TouchableOpacity>

                <Text style={{ marginTop: 15 }}>{`Current tag JSON: ${JSON.stringify(tag)}`}</Text>
            </View>
        )
    }

    _onTagDiscovered = tag => {
        console.log('Tag Discovered', tag);
        this.setState({ tag });
    }

    _startDetection = () => {
        NfcManager.registerTagEvent(this._onTagDiscovered)
            .then(result => {
                console.log('registerTagEvent OK', result)
            })
            .catch(error => {
                console.warn('registerTagEvent fail', error)
            })
    }

    _stopDetection = () => {
        NfcManager.unregisterTagEvent()
            .then(result => {
                console.log('unregisterTagEvent OK', result)
            })
            .catch(error => {
                console.warn('unregisterTagEvent fail', error)
            })
    }

    _clearMessages = () => {
        this.setState({tag: null});
    }

    _goToNfcSetting = () => {
        NfcManager.goToNfcSetting()
            .then(result => {
                console.log('goToNfcSetting OK', result)
            })
            .catch(error => {
                console.warn('goToNfcSetting fail', error)
            })
    }

    _testNdefParser = () => {
        const sampleTag = {
            "id": [
                4,
                109,
                -123,
                10,
                116,
                76,
                -127,
            ],
            "maxSize": 142,
            "ndefMessage": [
                {
                    "id": [],
                    "payload": [
                        1,
                        101,
                        98,
                        115,
                        108,
                        46,
                        104,
                        107,
                    ],
                    "tnf": 1,
                    "type": [
                        85,
                    ],
                },
            ],
            "techTypes": [
                "android.nfc.tech.NfcA",
                "android.nfc.tech.MifareUltralight",
                "android.nfc.tech.Ndef",
            ],
            "type": "NFC Forum Type 2",
        };

        let {uri} = NdefParser.parseUri(sampleTag.ndefMessage[0]);
        console.log('parseUri: ' + uri);
    }
}

export default App;
