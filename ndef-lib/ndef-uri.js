var util = require('./ndef-util');

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
function encode(uri) {
    
    var prefix,
        protocolCode,
        encoded;

    // check each protocol, unless we've found a match
    // "urn:" is the one exception where we need to keep checking
    // slice so we don't check ""
    protocols.slice(1).forEach(function(protocol) {                        
        if ((!prefix || prefix === "urn:") && uri.indexOf(protocol) === 0) { 
            prefix = protocol;
        }
    });

    if (!prefix) {
        prefix = "";
    }
    
    encoded = util.stringToBytes(uri.slice(prefix.length));
    protocolCode = protocols.indexOf(prefix);    
    // prepend protocol code
    encoded.unshift(protocolCode);
    
    return encoded; 
}

module.exports = {
    encodePayload: encode,
    decodePayload: decode
}
