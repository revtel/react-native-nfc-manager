// ndef.js
// Copyright 2013 Don Coleman
//
// This code is from phonegap-nfc.js https://github.com/don/phonegap-nfc

var util = require('./ndef-util'),
    textHelper = require('./ndef-text'),
    uriHelper = require('./ndef-uri');

var ndef = {

    // see android.nfc.NdefRecord for documentation about constants
    // http://developer.android.com/reference/android/nfc/NdefRecord.html
    TNF_EMPTY: 0x0,
    TNF_WELL_KNOWN: 0x01,
    TNF_MIME_MEDIA: 0x02,
    TNF_ABSOLUTE_URI: 0x03,
    TNF_EXTERNAL_TYPE: 0x04,
    TNF_UNKNOWN: 0x05,
    TNF_UNCHANGED: 0x06,
    TNF_RESERVED: 0x07,

    RTD_TEXT: "T", // [0x54]
    RTD_URI: "U", // [0x55]
    RTD_SMART_POSTER: "Sp", // [0x53, 0x70]
    RTD_ALTERNATIVE_CARRIER: "ac", //[0x61, 0x63]
    RTD_HANDOVER_CARRIER: "Hc", // [0x48, 0x63]
    RTD_HANDOVER_REQUEST: "Hr", // [0x48, 0x72]
    RTD_HANDOVER_SELECT: "Hs", // [0x48, 0x73]

    /**
     * Creates a JSON representation of a NDEF Record.
     *
     * @tnf 3-bit TNF (Type Name Format) - use one of the TNF_* constants
     * @type byte array, containing zero to 255 bytes, must not be null
     * @id byte array, containing zero to 255 bytes, must not be null
     * @payload byte array, containing zero to (2 ** 32 - 1) bytes, must not be null
     *
     * @returns JSON representation of a NDEF record
     *
     * @see Ndef.textRecord, Ndef.uriRecord and Ndef.mimeMediaRecord for examples
     */
    record: function (tnf, type, id, payload) {

        // handle null values
        if (!tnf) { tnf = ndef.TNF_EMPTY; }
        if (!type) { type = []; }
        if (!id) { id = []; }
        if (!payload) { payload = []; }

        // store type as String so it's easier to compare
        if(type instanceof Array) {
            type = util.bytesToString(type);
        }

        // in the future, id could be a String
        if (!(id instanceof Array)) {
           id = util.stringToBytes(id);
        }

        // Payload must be binary
        if (!(payload instanceof Array)) {
           payload = util.stringToBytes(payload);
        }

        var record = {
            tnf: tnf,
            type: type,
            id: id,
            payload: payload
        };

        // Experimental feature
        // Convert payload to text for Text and URI records
        if (tnf === ndef.TNF_WELL_KNOWN) {
            switch(record.type) {
                case ndef.RTD_TEXT:
                    record.value = ndef.text.decodePayload(record.payload);
                    break;
                case ndef.RTD_URI:
                    record.value = ndef.uri.decodePayload(record.payload);
                    break;
            }
        }

        return record;
    },

    /**
     * Helper that creates an NDEF record containing plain text.
     *
     * @text String of text to encode
     * @languageCode ISO/IANA language code. Examples: “fi”, “en-US”, “fr-CA”, “jp”. (optional)
     * @id byte[] (optional)
     */
    textRecord: function (text, languageCode, id) {
        var payload = textHelper.encodePayload(text, languageCode);
        if (!id) { id = []; }

        return ndef.record(ndef.TNF_WELL_KNOWN, ndef.RTD_TEXT, id, payload);
    },

    /**
     * Helper that creates a NDEF record containing a URI.
     *
     * @uri String
     * @id byte[] (optional)
     */
    uriRecord: function (uri, id) {
        var payload = uriHelper.encodePayload(uri);
        if (!id) { id = []; }
        return ndef.record(ndef.TNF_WELL_KNOWN, ndef.RTD_URI, id, payload);
    },

    /**
     * Helper that creates a NDEF record containing an absolute URI.
     *
     * An Absolute URI record means the URI describes the payload of the record.
     *
     * For example a SOAP message could use "http://schemas.xmlsoap.org/soap/envelope/"
     * as the type and XML content for the payload.
     *
     * Absolute URI can also be used to write LaunchApp records for Windows.
     *
     * See 2.4.2 Payload Type of the NDEF Specification
     * http://www.nfc-forum.org/specs/spec_list#ndefts
     *
     * Note that by default, Android will open the URI defined in the type
     * field of an Absolute URI record (TNF=3) and ignore the payload.
     * BlackBerry and Windows do not open the browser for TNF=3.
     *
     * To write a URI as the payload use ndef.uriRecord(uri)
     *
     * @uri String
     * @payload byte[] or String
     * @id byte[] (optional)
     */
    absoluteUriRecord: function (uri, payload, id) {
        if (!id) { id = []; }
        if (!payload) { payload = []; }
        return ndef.record(ndef.TNF_ABSOLUTE_URI, uri, id, payload);
    },

    /**
     * Helper that creates a NDEF record containing an mimeMediaRecord.
     *
     * @mimeType String
     * @payload byte[]
     * @id byte[] (optional)
     */
    mimeMediaRecord: function (mimeType, payload, id) {
        if (!id) { id = []; }
        return ndef.record(ndef.TNF_MIME_MEDIA, mimeType, id, payload);
    },

    /**
     * Helper that creates an NDEF record containing an Smart Poster.
     *
     * @ndefRecords array of NDEF Records
     * @id byte[] (optional)
     */
    smartPoster: function (ndefRecords, id) {
        var payload = [];

        if (!id) { id = []; }

        if (ndefRecords)
        {
            // make sure we have an array of something like NDEF records before encoding
            if (ndefRecords[0] instanceof Object && ndefRecords[0].hasOwnProperty('tnf')) {
                payload = ndef.encodeMessage(ndefRecords);
            } else {
                // assume the caller has already encoded the NDEF records into a byte array
                payload = ndefRecords;
            }
        } else {
            console.log("WARNING: Expecting an array of NDEF records");
        }

        return ndef.record(ndef.TNF_WELL_KNOWN, ndef.RTD_SMART_POSTER, id, payload);
    },

    /**
     * Helper that creates an empty NDEF record.
     *
     */
    emptyRecord: function() {
        return ndef.record(ndef.TNF_EMPTY, [], [], []);
    },

    /**
    * Helper that creates an Android Application Record (AAR).
    * http://developer.android.com/guide/topics/connectivity/nfc/nfc.html#aar
    *
    */
    androidApplicationRecord: function(packageName) {
        return ndef.record(ndef.TNF_EXTERNAL_TYPE, "android.com:pkg", [], packageName);
    },


    /**
     * Encodes an NDEF Message into bytes that can be written to a NFC tag.
     *
     * @ndefRecords an Array of NDEF Records
     *
     * @returns byte array
     *
     * @see NFC Data Exchange Format (NDEF) http://www.nfc-forum.org/specs/spec_list/
     */
    encodeMessage: function (ndefRecords) {

        var encoded = [],
            tnf_byte,
            record_type,
            payload_length,
            id_length,
            i,
            mb, me, // messageBegin, messageEnd
            cf = false, // chunkFlag TODO implement
            sr, // boolean shortRecord
            il; // boolean idLengthFieldIsPresent

        for(i = 0; i < ndefRecords.length; i++) {

            mb = (i === 0);
            me = (i === (ndefRecords.length - 1));
            sr = (ndefRecords[i].payload.length < 0xFF);
            il = (ndefRecords[i].id.length > 0);
            tnf_byte = ndef.encodeTnf(mb, me, cf, sr, il, ndefRecords[i].tnf);
            encoded.push(tnf_byte);

            // type is stored as String, converting to bytes for storage
            record_type = util.stringToBytes(ndefRecords[i].type);
            encoded.push(record_type.length);

            if (sr) {
                payload_length = ndefRecords[i].payload.length;
                encoded.push(payload_length);
            } else {
                payload_length = ndefRecords[i].payload.length;
                // 4 bytes
                encoded.push((payload_length >> 24));
                encoded.push((payload_length >> 16));
                encoded.push((payload_length >> 8));
                encoded.push((payload_length & 0xFF));
            }

            if (il) {
                id_length = ndefRecords[i].id.length;
                encoded.push(id_length);
            }

            encoded = encoded.concat(record_type);

            if (il) {
                encoded = encoded.concat(ndefRecords[i].id);
            }

            encoded = encoded.concat(ndefRecords[i].payload);
        }

        return encoded;
    },

    /**
     * Decodes an array bytes into an NDEF Message
     *
     * @ndefBytes an array bytes or Buffer that was read from a NFC tag
     *
     * @returns array of NDEF Records
     *
     * @see NFC Data Exchange Format (NDEF) http://www.nfc-forum.org/specs/spec_list/
     */
    decodeMessage: function (ndefBytes) {

        // ndefBytes can be an array of bytes e.g. [0x03, 0x31, 0xd1] or a Buffer
        var bytes;
        // if (ndefBytes instanceof Buffer) {
        //     // get an array of bytes
        //     bytes = Array.prototype.slice.call(ndefBytes, 0);
        // } else if (ndefBytes instanceof Array) {
        if (ndefBytes instanceof Array) {
            bytes = ndefBytes.slice(0);
        } else {
            throw new Error('ndef.decodeMessage requires a Buffer or an Array of bytes');
        }

        var bytes = bytes.slice(0), // clone since parsing is destructive
            ndef_message = [],
            tnf_byte,
            header,
            type_length = 0,
            payload_length = 0,
            id_length = 0,
            record_type = [],
            id = [],
            payload = [];

        while(bytes.length) {

            tnf_byte = bytes.shift();
            header = ndef.decodeTnf(tnf_byte);

            type_length = bytes.shift();

            if (header.sr) {
                payload_length = bytes.shift();
            } else {
                // next 4 bytes are length
                payload_length = ((0xFF & bytes.shift()) << 24) |
                    ((0xFF & bytes.shift()) << 16) |
                    ((0xFF & bytes.shift()) << 8) |
                    (0xFF & bytes.shift());
            }

            if (header.il) {
                id_length = bytes.shift();
            }

            record_type = bytes.splice(0, type_length);
            id = bytes.splice(0, id_length);
            payload = bytes.splice(0, payload_length);

            ndef_message.push(
                ndef.record(header.tnf, record_type, id, payload)
            );

            if (header.me) break; // last message
        }

        return ndef_message;
    },

    /**
     * Decode the bit flags from a TNF Byte.
     *
     * @returns object with decoded data
     *
     *  See NFC Data Exchange Format (NDEF) Specification Section 3.2 RecordLayout
     */
    decodeTnf: function (tnf_byte) {
        return {
            mb: (tnf_byte & 0x80) !== 0,
            me: (tnf_byte & 0x40) !== 0,
            cf: (tnf_byte & 0x20) !== 0,
            sr: (tnf_byte & 0x10) !== 0,
            il: (tnf_byte & 0x8) !== 0,
            tnf: (tnf_byte & 0x7)
        };
    },

    /**
     * Encode NDEF bit flags into a TNF Byte.
     *
     * @returns tnf byte
     *
     *  See NFC Data Exchange Format (NDEF) Specification Section 3.2 RecordLayout
     */
    encodeTnf: function (mb, me, cf, sr, il, tnf) {

        var value = tnf;

        if (mb) {
            value = value | 0x80;
        }

        if (me) {
            value = value | 0x40;
        }

        // note if cf: me, mb, li must be false and tnf must be 0x6
        if (cf) {
            value = value | 0x20;
        }

        if (sr) {
            value = value | 0x10;
        }

        if (il) {
            value = value | 0x8;
        }

        return value;
    },

    // TODO test with byte[] and string
    isType: function(record, tnf, type) {

        if (record.tnf === tnf) {
            return (s(record.type) === s(type));
        }
        return false;

    }

};

function tnfToString(tnf) {
    var value = tnf;

    switch (tnf) {
        case ndef.TNF_EMPTY:
            value = "Empty";
            break;
        case ndef.TNF_WELL_KNOWN:
            value = "Well Known";
            break;
        case ndef.TNF_MIME_MEDIA:
            value = "Mime Media";
            break;
        case ndef.TNF_ABSOLUTE_URI:
            value = "Absolute URI";
            break;
        case ndef.TNF_EXTERNAL_TYPE:
            value = "External";
            break;
        case ndef.TNF_UNKNOWN:
            value = "Unknown";
            break;
        case ndef.TNF_UNCHANGED:
            value = "Unchanged";
            break;
        case ndef.TNF_RESERVED:
            value = "Reserved";
            break;
    }
    return value;
}

// Convert NDEF records and messages to strings
// This works OK for demos, but real code proably needs
// a custom implementation. It would be nice to make
// smarter record objects that can print themselves
var stringifier = {

    stringify: function (data, separator) {

        if (Array.isArray(data)) {

            if (typeof data[0] === 'number') {
                // guessing this message bytes
                data = ndef.decodeMessage(data);
            }

            return stringifier.printRecords(data, separator);
        } else {
            return stringifier.printRecord(data, separator);
        }
    },

    // @message - NDEF Message (array of NDEF Records)
    // @separator - line separator, optional, defaults to \n
    // @returns string with NDEF Message
    printRecords: function (message, separator) {

        if(!separator) { separator = "\n"; }
        result = "";

        // Print out the payload for each record
        message.forEach(function(record) {
            result += stringifier.printRecord(record, separator);
            result += separator;
        });

        return result.slice(0, (-1 * separator.length));
    },

    // @record - NDEF Record
    // @separator - line separator, optional, defaults to \n
    // @returns string with NDEF Record
    printRecord: function (record, separator) {

        var result = "";

        if(!separator) { separator = "\n"; }

        switch(record.tnf) {
            case ndef.TNF_EMPTY:
                result += "Empty Record";
                result += separator;
                break;
            case ndef.TNF_WELL_KNOWN:
                result += stringifier.printWellKnown(record, separator);
                break;
            case ndef.TNF_MIME_MEDIA:
                result += "MIME Media";
                result += separator;
                result += s(record.type);
                result += separator;
                result += s(record.payload); // might be binary
                break;
            case ndef.TNF_ABSOLUTE_URI:
                result += "Absolute URI";
                result += separator;
                result += s(record.type);    // the URI is the type
                result += separator;
                result += s(record.payload); // might be binary
                break;;
            case ndef.TNF_EXTERNAL_TYPE:
                // AAR contains strings, other types could
                // contain binary data
                result += "External";
                result += separator;
                result += s(record.type);
                result += separator;
                result += s(record.payload);
                break;
            default:
                result += s("Can't process TNF " + record.tnf);
        }

        result += separator;
        return result;
    },

    printWellKnown: function (record, separator) {

        var result = "";

        if (record.tnf !== ndef.TNF_WELL_KNOWN) {
            return "ERROR expecting TNF Well Known";
        }

        switch(record.type) {
            case ndef.RTD_TEXT:
                result += "Text Record";
                result += separator;
                result += (ndef.text.decodePayload(record.payload));
                break;
            case ndef.RTD_URI:
                result += "URI Record";
                result += separator;
                result += (ndef.uri.decodePayload(record.payload));
                break;
            case ndef.RTD_SMART_POSTER:
                result += "Smart Poster";
                result += separator;
                // the payload of a smartposter is a NDEF message
                result += stringifier.printRecords(ndef.decodeMessage(record.payload));
                break;
            default:
                // attempt to display other types
                result += record.type + " Record";
                result += separator;
                result += s(record.payload);
        }

        return result;
    }
};

// convert bytes to a String
function s(bytes) {
    if (typeof(bytes) === 'string') {
        return bytes;
    }

    return bytes.reduce(function (acc, byte) { 
        return acc + String.fromCharCode(byte); 
    }, '')
    // return new Buffer(bytes).toString();
}

// expose helper objects
ndef.text = textHelper;
ndef.uri = uriHelper;
ndef.tnfToString = tnfToString;
ndef.util = util;
ndef.stringify = stringifier.stringify;

module.exports = ndef;
