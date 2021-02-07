var util = require('./util');

// decode text bytes from ndef record payload
// @returns a string
function decode(data) {
  var languageCodeLength = data[0] & 0x3f; // 6 LSBs
  // languageCode = data.slice(1, 1 + languageCodeLength),
  // utf16 = (data[0] & 0x80) !== 0; // assuming UTF-16BE

  // TODO need to deal with UTF in the future
  // console.log("lang " + languageCode + (utf16 ? " utf16" : " utf8"));

  return util.bytesToString(data.slice(languageCodeLength + 1));
}

// encode text payload
// @returns an array of bytes
function encode(text, lang, encoding) {
  // ISO/IANA language code, but we're not enforcing
  if (!lang) {
    lang = 'en';
  }

  var encoded = util.stringToBytes(lang + text);
  encoded.unshift(lang.length);

  return encoded;
}

module.exports = {
  encodePayload: encode,
  decodePayload: decode,
};
