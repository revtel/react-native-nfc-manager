const ndef = require('./ndef');
const constants = require('./constants');

// Convert NDEF records and messages to strings
// This works OK for demos, but real code proably needs
// a custom implementation. It would be nice to make
// smarter record objects that can print themselves
let stringifier = {
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
    if (!separator) {
      separator = '\n';
    }
    let result = '';

    // Print out the payload for each record
    message.forEach(function (record) {
      result += stringifier.printRecord(record, separator);
      result += separator;
    });

    return result.slice(0, -1 * separator.length);
  },

  // @record - NDEF Record
  // @separator - line separator, optional, defaults to \n
  // @returns string with NDEF Record
  printRecord: function (record, separator) {
    let result = '';

    if (!separator) {
      separator = '\n';
    }

    switch (record.tnf) {
      case constants.TNF_EMPTY:
        result += 'Empty Record';
        result += separator;
        break;
      case constants.TNF_WELL_KNOWN:
        result += stringifier.printWellKnown(record, separator);
        break;
      case constants.TNF_MIME_MEDIA:
        result += 'MIME Media';
        result += separator;
        result += s(record.type);
        result += separator;
        result += s(record.payload); // might be binary
        break;
      case constants.TNF_ABSOLUTE_URI:
        result += 'Absolute URI';
        result += separator;
        result += s(record.type); // the URI is the type
        result += separator;
        result += s(record.payload); // might be binary
        break;
      case constants.TNF_EXTERNAL_TYPE:
        // AAR contains strings, other types could
        // contain binary data
        result += 'External';
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
    let result = '';

    if (record.tnf !== constants.TNF_WELL_KNOWN) {
      return 'ERROR expecting TNF Well Known';
    }

    switch (record.type) {
      case constants.RTD_TEXT:
        result += 'Text Record';
        result += separator;
        result += ndef.text.decodePayload(record.payload);
        break;
      case constants.RTD_URI:
        result += 'URI Record';
        result += separator;
        result += ndef.uri.decodePayload(record.payload);
        break;
      case constants.RTD_SMART_POSTER:
        result += 'Smart Poster';
        result += separator;
        // the payload of a smartposter is a NDEF message
        result += stringifier.printRecords(ndef.decodeMessage(record.payload));
        break;
      default:
        // attempt to display other types
        result += record.type + ' Record';
        result += separator;
        result += s(record.payload);
    }

    return result;
  },

  tnfToString: function (tnf) {
    let value = tnf;

    switch (tnf) {
      case constants.TNF_EMPTY:
        value = 'Empty';
        break;
      case constants.TNF_WELL_KNOWN:
        value = 'Well Known';
        break;
      case constants.TNF_MIME_MEDIA:
        value = 'Mime Media';
        break;
      case constants.TNF_ABSOLUTE_URI:
        value = 'Absolute URI';
        break;
      case constants.TNF_EXTERNAL_TYPE:
        value = 'External';
        break;
      case constants.TNF_UNKNOWN:
        value = 'Unknown';
        break;
      case constants.TNF_UNCHANGED:
        value = 'Unchanged';
        break;
      case constants.TNF_RESERVED:
        value = 'Reserved';
        break;
    }
    return value;
  },
};

function s(bytes) {
  if (typeof bytes === 'string') {
    return bytes;
  }

  return bytes.reduce(function (acc, byte) {
    return acc + String.fromCharCode(byte);
  }, '');
}

module.exports = stringifier;
