const util = require('./util');
const protocols = require('./constants').RTD_URI_PROTOCOLS;

// decode a URI payload bytes
// @returns a string
function decode(data) {
  var prefix = protocols[data[0]];
  if (!prefix) {
    // 36 to 255 should be ""
    prefix = '';
  }
  return prefix + util.bytesToString(data.slice(1));
}

// shorten a URI with standard prefix
// @returns an array of bytes
function encode(uri) {
  var prefix, protocolCode, encoded;

  // check each protocol, unless we've found a match
  // "urn:" is the one exception where we need to keep checking
  // slice so we don't check ""
  protocols.slice(1).forEach(function (protocol) {
    if ((!prefix || prefix === 'urn:') && uri.indexOf(protocol) === 0) {
      prefix = protocol;
    }
  });

  if (!prefix) {
    prefix = '';
  }

  encoded = util.stringToBytes(uri.slice(prefix.length));
  protocolCode = protocols.indexOf(prefix);
  // prepend protocol code
  encoded.unshift(protocolCode);

  return encoded;
}

module.exports = {
  encodePayload: encode,
  decodePayload: decode,
};
