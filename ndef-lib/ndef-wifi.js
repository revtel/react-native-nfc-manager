var util = require('./ndef-util');
var ByteBuffer = require("bytebuffer");


const CREDENTIAL_FIELD_ID = 0x100e;
const SSID_FIELD_ID = 0x1045;
const AUTH_TYPE_FIELD_ID = 0x1003;
const AUTH_TYPE_WPA2_PSK = 0x0020;
const NETWORK_KEY_FIELD_ID = 0x1027;
const MAX_SSID_SIZE_BYTES = 32;
const MAX_MAC_ADDRESS_SIZE_BYTES = 6;
const MAX_NETWORK_KEY_SIZE_BYTES = 64;

// URI identifier codes from URI Record Type Definition NFCForum-TS-RTD_URI_1.0 2006-07-24
// index in array matches code in the spec
var protocols = [ "", "http://www.", "https://www.", "http://", "https://", "tel:", "mailto:", "ftp://anonymous:anonymous@", "ftp://ftp.", "ftps://", "sftp://", "smb://", "nfs://", "ftp://", "dav://", "news:", "telnet://", "imap:", "rtsp://", "urn:", "pop:", "sip:", "sips:", "tftp:", "btspp://", "btl2cap://", "btgoep://", "tcpobex://", "irdaobex://", "file://", "urn:epc:id:", "urn:epc:tag:", "urn:epc:pat:", "urn:epc:raw:", "urn:epc:", "urn:nfc:" ]

// decode a URI payload bytes
// @returns a string
function decode(data) {
    var prefix = protocols[data[0]];
    if (!prefix) { // 36 to 255 should be ""
        prefix = "";
    }
    return prefix + util.bytesToString(data.slice(1));      
} 

// shorten a URI with standard prefix
// @returns an array of bytes
function encode(arr) {

    return arr; 
}

module.exports = {
    encodePayload: encode,
    decodePayload: decode
}
