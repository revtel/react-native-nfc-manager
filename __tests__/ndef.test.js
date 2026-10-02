const ndef = require('../ndef-lib');

const textMessageHelloWorld = [
  209,
  1,
  15,
  84,
  2,
  101,
  110,
  104,
  101,
  108,
  108,
  111,
  44,
  32,
  119,
  111,
  114,
  108,
  100,
];

const urlMessageNodeJSorg = [
  209,
  1,
  11,
  85,
  3,
  110,
  111,
  100,
  101,
  106,
  115,
  46,
  111,
  114,
  103,
];

const multipleRecordMessage = [
  145,
  1,
  15,
  84,
  2,
  101,
  110,
  104,
  101,
  108,
  108,
  111,
  44,
  32,
  119,
  111,
  114,
  108,
  100,
  17,
  1,
  11,
  85,
  3,
  110,
  111,
  100,
  101,
  106,
  115,
  46,
  111,
  114,
  103,
  82,
  9,
  27,
  116,
  101,
  120,
  116,
  47,
  106,
  115,
  111,
  110,
  123,
  34,
  109,
  101,
  115,
  115,
  97,
  103,
  101,
  34,
  58,
  32,
  34,
  104,
  101,
  108,
  108,
  111,
  44,
  32,
  119,
  111,
  114,
  108,
  100,
  34,
  125,
];

test('build and parse text', () => {
  const text = 'hello, world';
  let message = [ndef.textRecord(text)];

  let encoded = ndef.encodeMessage(message);
  expect(encoded).toEqual(textMessageHelloWorld);

  let decodedMessage = ndef.decodeMessage(encoded);
  expect(message[0]).toEqual(decodedMessage[0]);
  expect(ndef.text.decodePayload(message[0].payload)).toEqual(text);
});

test('build and parse text outside the basic multilingual plane', () => {
  const text = 'hello \u{1f44b}';
  let message = [ndef.textRecord(text)];

  let encoded = ndef.encodeMessage(message);
  let decodedMessage = ndef.decodeMessage(encoded);

  expect(ndef.text.decodePayload(decodedMessage[0].payload)).toEqual(text);
});

test('reject utf-8 sequences that decode above the unicode maximum', () => {
  // 0xf7 0xbf 0xbf 0xbf decodes to U+1FFFFF, which is not a valid code point
  expect(ndef.util.bytesToString([0xf7, 0xbf, 0xbf, 0xbf])).toBeNull();
});

test('build and parse uri', () => {
  let message = [ndef.uriRecord('http://nodejs.org')];

  let encoded = ndef.encodeMessage(message);
  expect(encoded).toEqual(urlMessageNodeJSorg);

  let decodedMessage = ndef.decodeMessage(encoded);
  expect(message[0]).toEqual(decodedMessage[0]);
});

test.each([
  ['Array', (bytes) => bytes.slice()],
  ['Buffer', (bytes) => Buffer.from(bytes)],
  ['Uint8Array', (bytes) => Uint8Array.from(bytes)],
])('decode %s bytes without changing the input', (_name, createBytes) => {
  const input = createBytes(multipleRecordMessage);
  const before = Array.from(input);
  const expected = ndef.decodeMessage(multipleRecordMessage);

  expect(ndef.decodeMessage(input)).toEqual(expected);
  expect(Array.from(input)).toEqual(before);
  expect(ndef.decodeMessage(input)).toEqual(expected);
});

test.each([
  ['Buffer', (bytes) => Buffer.from(bytes)],
  ['Uint8Array', (bytes) => Uint8Array.from(bytes)],
])('decode only the supplied %s subarray', (_name, createBytes) => {
  const backing = createBytes([0xff, ...textMessageHelloWorld, 0xff]);
  const before = Array.from(backing);
  const input = backing.subarray(1, backing.length - 1);

  expect(ndef.decodeMessage(input)).toEqual(
    ndef.decodeMessage(textMessageHelloWorld),
  );
  expect(Array.from(backing)).toEqual(before);
});

test.each([
  new DataView(new ArrayBuffer(3)),
  new Uint16Array([0xd0, 0x00, 0x00]),
  new ArrayBuffer(3),
  {0: 0xd0, length: 3},
  null,
])('reject unsupported NDEF input %p', (input) => {
  expect(() => ndef.decodeMessage(input)).toThrow(
    'ndef.decodeMessage requires a Buffer, Uint8Array, or an Array of bytes',
  );
});

test('build and parse multiple records', () => {
  var message = [
    ndef.textRecord('hello, world'),
    ndef.uriRecord('http://nodejs.org'),
    ndef.mimeMediaRecord('text/json', '{"message": "hello, world"}'),
  ];

  let encoded = ndef.encodeMessage(message);
  expect(encoded).toEqual(multipleRecordMessage);

  let decodedMessage = ndef.decodeMessage(encoded);
  expect(message[0]).toEqual(decodedMessage[0]);
  expect(message[1]).toEqual(decodedMessage[1]);
  expect(message[2]).toEqual(decodedMessage[2]);
});

test('build and parse wifi simple payload', () => {
  const wifiCredentials = {
    ssid: 'my-wifi-ap',
    networkKey: 'Abcabc123',
  };

  const payload = ndef.wifiSimple.encodePayload(wifiCredentials);
  const parsed = ndef.wifiSimple.decodePayload(payload);

  expect(parsed.ssid).toEqual(wifiCredentials.ssid);
  expect(parsed.networkKey).toEqual(wifiCredentials.networkKey);
  expect(parsed.authType).toEqual(ndef.wifiSimple.authTypes.WPA2_PSK);
});
