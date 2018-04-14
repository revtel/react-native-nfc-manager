let arrayEqual = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
let bytesToStr = bytes => bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');

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

function parseText(record) {
    const RTD_TEXT_TYPE = [0x54];
    if (record && record.tnf === 1) {
        if (record.type && arrayEqual(RTD_TEXT_TYPE, record.type)) {
            try { // only handle utf8 for now
                let payload = record.payload;
                let languageCodeLength = (payload[0] & 0x3F);
                return _utf8ArrayToStr(payload.slice(languageCodeLength + 1));
            } catch (ex) {
                return null;
            }
        }
    }
    return null;
}

function parseUri(record) {
    const RTD_URI_TYPE = [0x55];
    const RTD_URI_SCHEMES = [
        '',
        'http://www.',
        'https://www.',
        'http://',
        'https://',
        'tel:',
        'mailto:',
        'ftp://anonymous:anonymous@',
        'ftp://ftp.',
        'ftps://',
        'sftp://',
        'smb://',
        'nfs://',
        'ftp://',
        'dav://',
        'news:',
        'telnet://',
        'imap:',
        'rtsp://',
        'urn:',
        'pop:',
        'sip:',
        'sips:',
        'tftp:',
        'btspp://',
        'btl2cap://',
        'btgoep://',
        'tcpobex://',
        'irdaobex://',
        'file://',
        'urn:epc:id:',
        'urn:epc:tag:',
        'urn:epc:pat:',
        'urn:epc:raw:',
        'urn:epc:',
        'urn:nfc:',
    ];
    if (record && record.tnf === 1) {
        if (record.type && arrayEqual(RTD_URI_TYPE, record.type)) {
            let payload = record.payload,
                scheme = RTD_URI_SCHEMES[payload[0]];
            if (scheme !== undefined) {
                try {
                    return {
                        uri: `${scheme}${bytesToStr(payload.slice(1))}`
                    }
                } catch (err) {
                    return null;
                }
            }
        }
    }
    return null;
}

export default {
    parseUri,
    parseText,
}
