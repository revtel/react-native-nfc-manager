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

const WellKnownRecord = {
  emptyRecord() {
    return createNdefRecord(constants.TNF_EMPTY, [], [], []);
  },

  absoluteUriRecord(uri, payload = [], id = []) {
    return createNdefRecord(constants.TNF_ABSOLUTE_URI, uri, id, payload);
  },

  mimeMediaRecord(mimeType, payload, id = []) {
    return createNdefRecord(constants.TNF_MIME_MEDIA, mimeType, id, payload);
  },

  textRecord(text, languageCode, id = []) {
    return createNdefRecord(
      constants.TNF_WELL_KNOWN,
      constants.RTD_TEXT,
      id,
      textHelper.encodePayload(text, languageCode),
    );
  },

  uriRecord(uri, id = []) {
    return createNdefRecord(
      constants.TNF_WELL_KNOWN,
      constants.RTD_URI,
      id,
      uriHelper.encodePayload(uri),
    );
  },

  smartPoster(ndefRecords, id = []) {
    let payload = [];

    if (ndefRecords) {
      // make sure we have an array of something like NDEF records before encoding
      if (
        ndefRecords[0] instanceof Object &&
        ndefRecords[0].hasOwnProperty('tnf')
      ) {
        payload = encodeNdefMessage(ndefRecords);
      } else {
        // assume the caller has already encoded the NDEF records into a byte array
        payload = ndefRecords;
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

const ExtraRecord = {
  androidApplicationRecord(packageName) {
    return createNdefRecord(
      constants.TNF_EXTERNAL_TYPE,
      'android.com:pkg',
      [],
      packageName,
    );
  },

  wifiSimpleRecord: function (credentials, id) {
    let payload = wifiSimpleHelper.encodePayload(credentials);
    if (!id) {
      id = [];
    }
    return WellKnownRecord.mimeMediaRecord(constants.MIME_WFA_WSC, payload, id);
  },
};

const NDEF = {
  ...constants,
  ...WellKnownRecord,
  ...ExtraRecord,

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
};

module.exports = NDEF;
