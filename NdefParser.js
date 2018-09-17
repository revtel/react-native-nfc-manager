const textHelper = require("./ndef-lib/ndef-text");
const uriHelper = require("./ndef-lib/ndef-uri");
const arrayEqual = (a, b) => a && b && a.length === b.length && a.every((v, i) => v === b[i]);

function parseText(record) {
    const RTD_TEXT_TYPE = [0x54];
    if (record && record.tnf === 1) {
        if (record.type && arrayEqual(RTD_TEXT_TYPE, record.type)) {
            try { // only handle utf8 for now
                return textHelper.decodePayload(record.payload);
            } catch (ex) {
                return null;
            }
        }
    }
    return null;
}

function parseUri(record) {
    const RTD_URI_TYPE = [0x55];
    if (record && record.tnf === 1) {
        if (record.type && arrayEqual(RTD_URI_TYPE, record.type)) {
            try {
                return {
                    uri: uriHelper.decodePayload(record.payload) 
                }
            } catch (err) {
                return null;
            }
        }
    }
    return null;
}

export default {
    parseUri,
    parseText,
}
