// ndef-util.js
// Copyright 2013 Don Coleman
//

// Thanks to
// https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
function _utf8ArrayToStr(data) {
    const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
    var count = data.length;
    var str = "";

    for (var index = 0; index < count;) {
        var ch = data[index++];
        if (ch & 0x80) {
            var extra = extraByteMap[(ch >> 3) & 0x07];
            if (!(ch & 0x40) || !extra || ((index + extra) > count))
                return null;

            ch = ch & (0x3F >> extra);
            for (; extra > 0; extra -= 1) {
                var chx = data[index++];
                if ((chx & 0xC0) != 0x80)
                    return null;

                ch = (ch << 6) | (chx & 0x3F);
            }
        }

        str += String.fromCharCode(ch);
    }

    return str;
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
