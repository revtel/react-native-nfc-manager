var util = require('./ndef-util');

// decode text bytes from ndef record payload
// @returns a string
function decode(data) {

    var languageCodeLength = (data[0] & 0x3F), // 6 LSBs
        languageCode = data.slice(1, 1 + languageCodeLength),
        utf16 = (data[0] & 0x80) !== 0; // assuming UTF-16BE

    // TODO need to deal with UTF in the future
    // console.log("lang " + languageCode + (utf16 ? " utf16" : " utf8"));
    
    var decodedString = util.bytesToString(data.slice(languageCodeLength + 1));
    
    if (typeof decodedString !== 'undefined' && typeof decodedString !== 'null' && strlen(decodedString) > 0) {
        return decodedString;
    }
    
    decodedString = "";
    var i, len, c;
    var char2, char3;

    len = data.length;
    i = 0;
    while(i < len) {
        c = data[i++];
        switch(c >> 4)
        {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            decodedString += String.fromCharCode(c);
            break;
            case 12: case 13:
            char2 = data[i++];
            decodedString += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
            break;
            case 14:
                char2 = data[i++];
                char3 = data[i++];
                decodedString += String.fromCharCode(((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
        }
    }

    return decodedString;
}

// encode text payload
// @returns an array of bytes
function encode(text, lang, encoding) {

    // ISO/IANA language code, but we're not enforcing
    if (!lang) { lang = 'en'; }

    var encoded = util.stringToBytes(lang + text);
    encoded.unshift(lang.length);

    return encoded;
}

module.exports = {
    encodePayload: encode,
    decodePayload: decode
}
