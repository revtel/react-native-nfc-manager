// originally from phonegap-nfc.js by Don Coleman
// adapted for react-native-nfc-manager by Richie Hsieh

const ndef = require('./ndef');
const util = require('./ndef-util');
const text = require('./ndef-text');
const uri = require('./ndef-uri');
const wifiSimple = require('./ndef-wifi-simple');
const constants = require('./constants');

module.exports = {
  ...constants,
  ...ndef,
  util,
  text,
  uri,
  wifiSimple,
  wifiSimpleRecord: function (credentials, id) {
    let payload = wifiSimple.encodePayload(credentials);
    if (!id) {
      id = [];
    }
    return ndef.mimeMediaRecord(constants.MIME_WFA_WSC, payload, id);
  },
};
