var util = require('./ndef-util');

const CREDENTIAL_FIELD_ID = '100e';
const SSID_FIELD_ID = '1045';
const AUTH_TYPE_FIELD_ID = '1003';
const AUTH_TYPE_OPEN = '0000';
const AUTH_TYPE_WPA2_PSK = '0020';
const NETWORK_KEY_FIELD_ID = '1027';

// decode string bytes from ndef record payload
// @returns an string of wifi credentials
function decode(data) {
  return util.bytesToString(data.slice(languageCodeLength + 1));
  // TODO: need to parse string  into json object
}

// encode wifi object payload
// @returns an array of bytes
function encode(credentials) {
  // credentials is an object containing wifi credentials such as ssid, networkKey and auth_type
  let ssid = credentials.ssid;
  let ssidSize = util.stringToBytes(ssid).length;
  let authType;
  if (credentials.authType == 'WPA') {
    authType = AUTH_TYPE_WPA2_PSK;
  } else {
    authType = AUTH_TYPE_OPEN;
  }
  let networkKey = credentials.networkKey;
  let networkKeySize = util.stringToBytes(networkKey).length;
  let bufferSize = 18 + ssidSize + networkKeySize; // size of required credential attributes

  let payload = [];
  payload.push.apply(payload, hexToBytes(CREDENTIAL_FIELD_ID));
  payload.push(0);//this zero is necessary because it serves as 'space' in credentials object when writing credentials into nfc tag
  payload.push(bufferSize - 4);
  payload.push.apply(payload, hexToBytes(SSID_FIELD_ID));
  payload.push(0);
  payload.push(ssidSize);
  payload.push.apply(payload, util.stringToBytes(ssid));
  payload.push.apply(payload, hexToBytes(AUTH_TYPE_FIELD_ID));
  payload.push(0);
  payload.push(2);
  payload.push.apply(payload, hexToBytes(authType));
  payload.push.apply(payload, hexToBytes(NETWORK_KEY_FIELD_ID));
  payload.push(0);
  payload.push(networkKeySize);
  payload.push.apply(payload, util.stringToBytes(networkKey));

  return payload;
}
function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}
module.exports = {
  encodePayload: encode,
  decodePayload: decode,
};
