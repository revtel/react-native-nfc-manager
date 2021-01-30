'use strict';
import {Platform} from 'react-native';
import ByteParser from './ByteParser';
import NdefParser from './NdefParser';
import Ndef from '../ndef-lib';
import {NfcEvents, NfcTech, NdefStatus} from './NfcManager';
import {NfcAdapter, NfcManagerAndroid} from './NfcManagerAndroid';
import {Nfc15693RequestFlagIOS, NfcManagerIOS} from './NfcManagerIOS';

let nfcManager = (() => {
  if (Platform.OS === 'ios') {
    return new NfcManagerIOS();
  } else {
    return new NfcManagerAndroid();
  }
})();

export default nfcManager;

export {
  ByteParser,
  NdefParser,
  NfcTech,
  NfcEvents,
  NfcAdapter,
  NdefStatus,
  Ndef,
  Nfc15693RequestFlagIOS,
};
