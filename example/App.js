import React, { Component } from 'react';
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
import NfcManager, {NdefParser} from 'react-native-nfc-manager';

const RtdType = {
    URL: 0,
    TEXT: 1,
};

function strToBytes(str) {
    let result = [];
    for (let i = 0; i < str.length; i++) {
        result.push(str.charCodeAt(i));
    }
    return result;
}

function buildUrlPayload(valueToWrite) {
    const urlBytes = strToBytes(valueToWrite);
    // in this example, we always use `http://` 
    const headerBytes = [0xD1, 0x01, (urlBytes.length + 1), 0x55, 0x03]; 
    return [...headerBytes, ...urlBytes];
}

function buildTextPayload(valueToWrite) {
    const textBytes = strToBytes(valueToWrite);
    // in this example. we always use `en`
    const headerBytes = [0xD1, 0x01, (textBytes.length + 3), 0x54, 0x02, 0x65, 0x6e];
    return [...headerBytes, ...textBytes];
}

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
            supported: true,
            enabled: false,
            isWriting: false,
            urlToWrite: 'www.google.com',
            rtdType: RtdType.URL,
            parsedText: null,
            tag: {},
        }
    }

    componentDidMount() {
        NfcManager.isSupported()
            .then(supported => {
                this.setState({ supported });
                if (supported) {
                    this._startNfc();
                }
            })
    }

    componentWillUnmount() {
        if (this._stateChangedSubscription) {
            this._stateChangedSubscription.remove();
        }
    }

    render() {
        let { supported, enabled, tag, isWriting, urlToWrite, parsedText, rtdType } = this.state;
        return (
            <ScrollView style={{flex: 1}}>
                { Platform.OS === 'ios' && <View style={{ height: 60 }} /> }

                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text>{`Is NFC supported ? ${supported}`}</Text>
                    <Text>{`Is NFC enabled (Android only)? ${enabled}`}</Text>

                    <TouchableOpacity style={{ marginTop: 20 }} onPress={this._startDetection}>
                        <Text style={{ color: 'blue' }}>Start Tag Detection</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginTop: 20 }} onPress={this._stopDetection}>
                        <Text style={{ color: 'red' }}>Stop Tag Detection</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginTop: 20 }} onPress={this._clearMessages}>
                        <Text>Clear</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={{ marginTop: 20 }} onPress={this._goToNfcSetting}>
                        <Text >(android) Go to NFC setting</Text>
                    </TouchableOpacity>

                    {
                        <View style={{padding: 10, marginTop: 20, backgroundColor: '#e0e0e0'}}>
                            <TouchableOpacity style={{margin: 10}} onPress={this._runNdefTechTest}>
                                <Text>(android) Ndef Tech Test</Text>
                            </TouchableOpacity>

                            <Text>(android) Write NDEF Test</Text>
                            <View style={{flexDirection: 'row', marginTop: 10}}>
                                <Text style={{marginRight: 15}}>Types:</Text>
                                {
                                    Object.keys(RtdType).map(
                                        key => (
                                            <TouchableOpacity 
                                                key={key}
                                                style={{marginRight: 10}}
                                                onPress={() => this.setState({rtdType: RtdType[key]})}
                                            >
                                                <Text style={{color: rtdType === RtdType[key] ? 'blue' : '#aaa'}}>
                                                    {key}
                                                </Text>
                                            </TouchableOpacity>
                                        )
                                    )
                                }
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                { rtdType === RtdType.URL && <Text>http://.</Text> }
                                <TextInput
                                    style={{width: 200}}
                                    value={urlToWrite}
                                    onChangeText={urlToWrite => this.setState({ urlToWrite })}
                                />
                            </View>

                            <TouchableOpacity 
                                style={{ marginTop: 20, borderWidth: 1, borderColor: 'blue', padding: 10 }} 
                                onPress={isWriting ? this._cancelNdefWrite : this._requestNdefWrite}>
                                <Text style={{color: 'blue'}}>{`(android) ${isWriting ? 'Cancel' : 'Write NDEF'}`}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={{ marginTop: 20, borderWidth: 1, borderColor: 'blue', padding: 10 }} 
                                onPress={isWriting ? this._cancelNdefWrite : this._requestFormat}>
                                <Text style={{color: 'blue'}}>{`(android) ${isWriting ? 'Cancel' : 'Format'}`}</Text>
                            </TouchableOpacity>
                        </View>
                    }

                    <Text style={{ marginTop: 20 }}>{`Current tag JSON: ${JSON.stringify(tag)}`}</Text>
                    { parsedText && <Text style={{ marginTop: 10, marginBottom: 20, fontSize: 18 }}>{`Parsed Text: ${parsedText}`}</Text>}
                </View>
            </ScrollView>
        )
    }

    _requestFormat = () => {
        let {isWriting} = this.state;
        if (isWriting) {
            return;
        }

        this.setState({isWriting: true});
        NfcManager.requestNdefWrite(null, {format: true})
            .then(() => console.log('format completed'))
            .catch(err => console.warn(err))
            .then(() => this.setState({isWriting: false}));
    }

    _runNdefTechTest = () => {
        NfcManager.requestTechnology('Ndef')
            .then(() => {
                console.warn('Ndef tech is OK!');
                return NfcManager.getNdefMessage()
            })
            .then(msg => {
                this.setState({tag: msg});
                let bytes = buildTextPayload("hi, nfc!");
                return NfcManager.writeNdefMessage(bytes)
            })
            .then(() => {
                return NfcManager.closeTechnology();
            })
            .catch(err => {
                console.warn(err);
                NfcManager.closeTechnology();
            })
    }

    _requestNdefWrite = () => {
        let {isWriting, urlToWrite, rtdType} = this.state;
        if (isWriting) {
            return;
        }

        let bytes;

        if (rtdType === RtdType.URL) {
            bytes = buildUrlPayload(urlToWrite);
        } else if (rtdType === RtdType.TEXT) {
            bytes = buildTextPayload(urlToWrite);
        }

        this.setState({isWriting: true});
        NfcManager.requestNdefWrite(bytes)
            .then(() => console.log('write completed'))
            .catch(err => console.warn(err))
            .then(() => this.setState({isWriting: false}));
    }

    _cancelNdefWrite = () => {
        this.setState({isWriting: false});
        NfcManager.cancelNdefWrite()
            .then(() => console.log('write cancelled'))
            .catch(err => console.warn(err))
    }

    _startNfc() {
        NfcManager.start({
            onSessionClosedIOS: () => {
                console.log('ios session closed');
            }
        })
            .then(result => {
                console.log('start OK', result);
            })
            .catch(error => {
                console.warn('start fail', error);
                this.setState({supported: false});
            })

        if (Platform.OS === 'android') {
            NfcManager.getLaunchTagEvent()
                .then(tag => {
                    console.log('launch tag', tag);
                    if (tag) {
                        this.setState({ tag });
                    }
                })
                .catch(err => {
                    console.log(err);
                })
            NfcManager.isEnabled()
                .then(enabled => {
                    this.setState({ enabled });
                })
                .catch(err => {
                    console.log(err);
                })
            NfcManager.onStateChanged(
                event => {
                    if (event.state === 'on') {
                        this.setState({enabled: true});
                    } else if (event.state === 'off') {
                        this.setState({enabled: false});
                    } else if (event.state === 'turning_on') {
                        // do whatever you want
                    } else if (event.state === 'turning_off') {
                        // do whatever you want
                    }
                }
            )
                .then(sub => {
                    this._stateChangedSubscription = sub; 
                    // remember to call this._stateChangedSubscription.remove()
                    // when you don't want to listen to this anymore
                })
                .catch(err => {
                    console.warn(err);
                })
        }
    }

    _onTagDiscovered = tag => {
        console.log('Tag Discovered', tag);
        this.setState({ tag });
        let url = this._parseUri(tag);
        if (url) {
            Linking.openURL(url)
                .catch(err => {
                    console.warn(err);
                })
        }

        let text = this._parseText(tag);
        this.setState({parsedText: text});
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
        if (Platform.OS === 'android') {
            NfcManager.goToNfcSetting()
                .then(result => {
                    console.log('goToNfcSetting OK', result)
                })
                .catch(error => {
                    console.warn('goToNfcSetting fail', error)
                })
        }
    }

    _parseUri = (tag) => {
        if (tag.ndefMessage) {
            let result = NdefParser.parseUri(tag.ndefMessage[0]),
                uri = result && result.uri;
            if (uri) {
                console.log('parseUri: ' + uri);
                return uri;
            }
        }
        return null;
    }

    _parseText = (tag) => {
        if (tag.ndefMessage) {
            return NdefParser.parseText(tag.ndefMessage[0]);
        }
        return null;
    }
}

export default App;
