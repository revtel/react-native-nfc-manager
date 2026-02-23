// originally from phonegap-nfc.js by Don Coleman
// adapted for react-native-nfc-manager by Richie Hsieh

const {
  createNdefRecord,
  encodeNdefMessage,
  decodeNdefMessage,
  equalToRecordType,
} = require('./ndef');
const constants = require('./constants');
const util = require('./util');
const textHelper = require('./ndef-text');
const uriHelper = require('./ndef-uri');
const wifiSimpleHelper = require('./ndef-wifi-simple');
const stringifier = require('./stringifier');

type Byte = number;
type ByteArray = Byte[];
type NdefRecord = {
  tnf: number;
  type: string | ByteArray;
  id: ByteArray;
  payload: ByteArray;
};

const PrimitiveRecord = {
  emptyRecord(): NdefRecord {
    return createNdefRecord(constants.TNF_EMPTY, [], [], []);
  },

  absoluteUriRecord(uri: string, payload: string | ByteArray = [], id: string | ByteArray = []): NdefRecord {
    return createNdefRecord(constants.TNF_ABSOLUTE_URI, uri, id, payload);
  },

  mimeMediaRecord(mimeType: string, payload: string | ByteArray, id: string | ByteArray = []): NdefRecord {
    return createNdefRecord(constants.TNF_MIME_MEDIA, mimeType, id, payload);
  },

  externalTypeRecord(externalType: string, payload: string | ByteArray, id: string | ByteArray = []): NdefRecord {
    return createNdefRecord(
      constants.TNF_EXTERNAL_TYPE,
      externalType,
      id,
      payload,
    );
  },
};

const WellKnownRecord = {
  textRecord(text: string, languageCode?: string, id: string | ByteArray = []): NdefRecord {
    return createNdefRecord(
      constants.TNF_WELL_KNOWN,
      constants.RTD_TEXT,
      id,
      textHelper.encodePayload(text, languageCode),
    );
  },

  uriRecord(uri: string, id: string | ByteArray = []): NdefRecord {
    return createNdefRecord(
      constants.TNF_WELL_KNOWN,
      constants.RTD_URI,
      id,
      uriHelper.encodePayload(uri),
    );
  },

  smartPoster(ndefRecords: NdefRecord[] | ByteArray, id: string | ByteArray = []): NdefRecord {
    let payload: ByteArray = [];

    if (ndefRecords) {
      // make sure we have an array of something like NDEF records before encoding
      if (
        ndefRecords[0] instanceof Object &&
        ndefRecords[0].hasOwnProperty('tnf')
      ) {
        payload = encodeNdefMessage(ndefRecords as NdefRecord[]);
      } else {
        // assume the caller has already encoded the NDEF records into a byte array
        payload = ndefRecords as ByteArray;
      }
    } else {
      console.log('WARNING: Expecting an array of NDEF records');
    }

    return createNdefRecord(
      constants.TNF_WELL_KNOWN,
      constants.RTD_SMART_POSTER,
      id,
      payload,
    );
  },
};

const ExtraTypeRecord = {
  androidApplicationRecord(packageName: string, id: string | ByteArray = []): NdefRecord {
    return PrimitiveRecord.externalTypeRecord(
      'android.com:pkg',
      packageName,
      id,
    );
  },

  wifiSimpleRecord: function (credentials: {ssid: string; networkKey: string; authType?: ByteArray}, id: string | ByteArray = []): NdefRecord {
    let payload = wifiSimpleHelper.encodePayload(credentials);
    return PrimitiveRecord.mimeMediaRecord(constants.MIME_WFA_WSC, payload, id);
  },
};

const NDEF = {
  ...constants,
  ...PrimitiveRecord,
  ...WellKnownRecord,
  ...ExtraTypeRecord,

  record: createNdefRecord,
  encodeMessage: encodeNdefMessage,
  decodeMessage: decodeNdefMessage,
  isType: equalToRecordType,

  // individual record type helpers
  text: textHelper,
  uri: uriHelper,
  wifiSimple: wifiSimpleHelper,

  // other helpers
  util,
  stringify: stringifier.stringify,
};

module.exports = NDEF;

export {};
