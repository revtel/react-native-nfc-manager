var util = require('./util');

const CREDENTIAL_FIELD_ID = [0x10, 0x0e];
const SSID_FIELD_ID = [0x10, 0x45];
const AUTH_TYPE_FIELD_ID = [0x10, 0x03];
const NETWORK_KEY_FIELD_ID = [0x10, 0x27];

const AUTH_TYPES = {
  OPEN: [0x00, 0x00],
  WPA2_PSK: [0x00, 0x20],
};

function _getLengthBytes(valueBytes) {
  if (valueBytes.length > 255) {
    return [Math.floor(valueBytes.length / 256), valueBytes.length % 256];
  }
  return [0x0, valueBytes.length];
}

function _arrayEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false;
    }
  }

  return true;
}

function _getNextTLV(bytes) {
  const type = bytes.slice(0, 2);
  const length = bytes.slice(2, 4);
  const value = bytes.slice(4, 4 + (length[0] * 256 + length[1]));
  return {
    type,
    length,
    value,
  };
}

// @returns an string of wifi credentials
function decode(bytes) {
  let result = {};

  while (bytes.length > 0) {
    let {type, value} = _getNextTLV(bytes);
    bytes = bytes.slice(4 + value.length, bytes.length);

    if (_arrayEqual(CREDENTIAL_FIELD_ID, type)) {
      let credential = value;

      while (credential.length > 0) {
        let tlv = _getNextTLV(credential);
        credential = credential.slice(4 + tlv.value.length, credential.length);

        if (_arrayEqual(AUTH_TYPE_FIELD_ID, tlv.type)) {
          result.authType = tlv.value;
        } else if (_arrayEqual(SSID_FIELD_ID, tlv.type)) {
          result.ssid = util.bytesToString(tlv.value);
        } else if (_arrayEqual(NETWORK_KEY_FIELD_ID, tlv.type)) {
          result.networkKey = util.bytesToString(tlv.value);
        }
      }
    }
  }

  return result;
}

// encode wifi object payload
// @returns an array of bytes
function encode({ssid, networkKey, authType = AUTH_TYPES.WPA2_PSK}) {
  if (typeof ssid !== 'string' || typeof networkKey !== 'string') {
    throw new Error('');
  }

  ssid = util.stringToBytes(ssid);
  networkKey = util.stringToBytes(networkKey);

  // build seperated TLV
  const authTypeTLV = [
    ...AUTH_TYPE_FIELD_ID,
    0x0,
    authType.length,
    ...authType,
  ];
  const ssidTLV = [...SSID_FIELD_ID, 0x0, ssid.length, ...ssid];
  const networkKeyTLV = [
    ...NETWORK_KEY_FIELD_ID,
    0x0,
    networkKey.length,
    ...networkKey,
  ];

  // build credential TLV
  const credentialValue = [...authTypeTLV, ...ssidTLV, ...networkKeyTLV];
  const credentialTLV = [
    ...CREDENTIAL_FIELD_ID,
    ..._getLengthBytes(credentialValue),
    ...credentialValue,
  ];

  return credentialTLV;
}

module.exports = {
  encodePayload: encode,
  decodePayload: decode,
  authTypes: AUTH_TYPES,
};
