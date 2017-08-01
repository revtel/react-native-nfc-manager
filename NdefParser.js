let arrayEqual = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);
let bytesToStr = bytes => bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');

function parseUri(record) {
    const RTD_URI_TYPE = [85];
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
    parseUri
}