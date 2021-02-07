import {Platform} from 'react-native';
import Ndef from '../ndef-lib';
import {NfcEvents, NfcTech, NdefStatus} from './NfcManager';
import {NfcAdapter, NfcManagerAndroid} from './NfcManagerAndroid';
import {Nfc15693RequestFlagIOS, NfcManagerIOS} from './NfcManagerIOS';

const nfcManager = (() => {
  if (Platform.OS === 'ios') {
    return new NfcManagerIOS();
  } else {
    return new NfcManagerAndroid();
  }
})();

export default nfcManager;

export {
  NfcTech,
  NfcEvents,
  NfcAdapter,
  Nfc15693RequestFlagIOS,
  Ndef,
  NdefStatus,
};
