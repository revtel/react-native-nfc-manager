const util = require('./util');

function createNdefRecord(tnf, type, id, payload) {
  if (
    tnf === undefined ||
    type === undefined ||
    id === undefined ||
    payload === undefined
  ) {
    throw new Error('missing required param');
  }

  // store type as String so it's easier to compare
  if (type instanceof Array) {
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

  return {
    tnf: tnf,
    type: type,
    id: id,
    payload: payload,
  };
}

function encodeNdefMessage(ndefRecords) {
  const encodeTnf = ({mb, me, cf, sr, il, tnf}) => {
    let value = tnf;

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
  };

  let encoded = [],
    tnf_byte,
    record_type,
    payload_length,
    id_length,
    i,
    mb,
    me, // messageBegin, messageEnd
    cf = false, // chunkFlag TODO implement
    sr, // boolean shortRecord
    il; // boolean idLengthFieldIsPresent

  for (i = 0; i < ndefRecords.length; i++) {
    mb = i === 0;
    me = i === ndefRecords.length - 1;
    sr = ndefRecords[i].payload.length < 0xff;
    il = ndefRecords[i].id.length > 0;
    tnf_byte = encodeTnf({mb, me, cf, sr, il, tnf: ndefRecords[i].tnf});
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
      encoded.push(payload_length >> 24);
      encoded.push(payload_length >> 16);
      encoded.push(payload_length >> 8);
      encoded.push(payload_length & 0xff);
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
}

function decodeNdefMessage(ndefBytes) {
  const decodeTnf = (tnf_byte) => ({
    mb: (tnf_byte & 0x80) !== 0,
    me: (tnf_byte & 0x40) !== 0,
    cf: (tnf_byte & 0x20) !== 0,
    sr: (tnf_byte & 0x10) !== 0,
    il: (tnf_byte & 0x8) !== 0,
    tnf: tnf_byte & 0x7,
  });

  // ndefBytes can be an array of bytes e.g. [0x03, 0x31, 0xd1] or a Buffer
  let bytes;
  if (ndefBytes instanceof Array) {
    bytes = ndefBytes.slice(0);
  } else {
    throw new Error(
      'ndef.decodeMessage requires a Buffer or an Array of bytes',
    );
  }

  bytes = bytes.slice(0); // clone since parsing is destructive
  let ndef_message = [],
    tnf_byte,
    header,
    type_length = 0,
    payload_length = 0,
    id_length = 0,
    record_type = [],
    id = [],
    payload = [];

  while (bytes.length) {
    tnf_byte = bytes.shift();
    header = decodeTnf(tnf_byte);

    type_length = bytes.shift();

    if (header.sr) {
      payload_length = bytes.shift();
    } else {
      // next 4 bytes are length
      payload_length =
        ((0xff & bytes.shift()) << 24) |
        ((0xff & bytes.shift()) << 16) |
        ((0xff & bytes.shift()) << 8) |
        (0xff & bytes.shift());
    }

    id_length = header.il ? bytes.shift() : 0;

    record_type = bytes.splice(0, type_length);
    id = bytes.splice(0, id_length);
    payload = bytes.splice(0, payload_length);

    ndef_message.push(createNdefRecord(header.tnf, record_type, id, payload));

    if (header.me) {
      break;
    } // last message
  }

  return ndef_message;
}

function equalToRecordType(record, tnf, type) {
  if (record.tnf === tnf) {
    if (Array.isArray(record.type)) {
      return util.bytesToString(record.type) === type;
    } else {
      return record.type === type;
    }
  }
  return record.tnf === tnf && record.type === type;
}

module.exports = {
  createNdefRecord,
  encodeNdefMessage,
  decodeNdefMessage,
  equalToRecordType,
};
