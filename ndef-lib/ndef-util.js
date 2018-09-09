// ndef-util.js
// Copyright 2013 Don Coleman
//

// This is from phonegap-nfc.js and is a combination of helpers in nfc and util
// https://github.com/chariotsolutions/phonegap-nfc/blob/master/www/phonegap-nfc.js
function _utf8ArrayToStr(array) {
    let out, i, len, c;
    let char2, char3;

    out = "";
    len = array.length;
    i = 0;
    while(i < len) {
        c = array[i++];
        switch(c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7: // 0xxxxxxx
                out += String.fromCharCode(c);
                break;
            case 12: case 13: // 110x xxxx   10xx xxxx
                char2 = array[i++];
                out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
                break;
            case 14: // 1110 xxxx  10xx xxxx  10xx xxxx
                char2 = array[i++];
                char3 = array[i++];
                out += String.fromCharCode(
                    ((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0)
                );
                break;
        }
    }

    return out;
}

// https://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
function _toUTF8Array(str) {
    var utf8 = [];
    for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                      0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                      0x80 | ((charcode>>6) & 0x3f),
                      0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff)<<10)
                      | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >>18),
                      0x80 | ((charcode>>12) & 0x3f),
                      0x80 | ((charcode>>6) & 0x3f),
                      0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

function stringToBytes(string) {
    return _toUTF8Array(string);
    // var bytes = Buffer(string).toJSON();
    // if (bytes.hasOwnProperty('data')) {
    //     // Node 0.12.x
    //     return bytes.data;
    // } else {
    //     // Node 0.10.x
    //     return bytes;
    // }
}

function bytesToString(bytes) {
    if (typeof(bytes) === 'string') {
        return bytes;
    }

    return _utf8ArrayToStr(bytes);
    // return Buffer(bytes).toString();
}

// useful for readable version of Tag UID
function bytesToHexString(bytes) {
    var dec, hexstring, bytesAsHexString = "";
    for (var i = 0; i < bytes.length; i++) {
       if (bytes[i] >= 0) {
           dec = bytes[i];
       } else {
           dec = 256 + bytes[i];
       }
       hexstring = dec.toString(16);
       // zero padding
       if (hexstring.length == 1) {
           hexstring = "0" + hexstring;
       }
       bytesAsHexString += hexstring;
    }
    return bytesAsHexString;
}

// i must be <= 256
function toHex(i) {
    var hex;

    if (i < 0) {
        i += 256;
    }
    hex = i.toString(16);

    // zero padding
    if (hex.length == 1) {
        hex = "0" + hex;
    }
    return hex;
}

function toPrintable(i) {
    if (i >= 0x20 & i <= 0x7F) {
        return String.fromCharCode(i);
    } else {
        return '.';
    }
}

module.exports = {
    stringToBytes: stringToBytes,
    bytesToString: bytesToString,
    bytesToHexString: bytesToHexString,
    toHex: toHex,
    toPrintable: toPrintable
};
