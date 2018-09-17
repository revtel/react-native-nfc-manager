const ndef = require("./ndef-lib");
const textHelper = require("./ndef-lib/ndef-text");

const textMessageHelloWorld = [ 209, 1, 15, 84, 2, 101, 110, 104, 101, 108, 108, 111,
            44, 32, 119, 111, 114, 108, 100 ];

const urlMessageNodeJSorg = [ 209, 1, 11, 85, 3, 110, 111, 100, 101, 106, 115, 46,
            111, 114, 103 ];

const multipleRecordMessage = [ 145, 1, 15, 84, 2, 101, 110, 104, 101, 108, 108, 111,
            44, 32, 119, 111, 114, 108, 100, 17, 1, 11, 85, 3, 110, 111, 100, 101,
            106, 115, 46, 111, 114, 103, 82, 9, 27, 116, 101, 120, 116, 47, 106, 115,
            111, 110, 123, 34, 109, 101, 115, 115, 97, 103, 101, 34, 58, 32, 34, 104,
            101, 108, 108, 111, 44, 32, 119, 111, 114, 108, 100, 34, 125 ];

test('build and parse text', () => {
    const text = "hello, world";
    let message = [
        ndef.textRecord(text)
    ];

    let encoded = ndef.encodeMessage(message);
    expect(encoded).toEqual(textMessageHelloWorld);

    let decodedMessage = ndef.decodeMessage(encoded);
    expect(message[0]).toEqual(decodedMessage[0]);
    expect(textHelper.decodePayload(message[0].payload)).toEqual(text);
});

test('build and parse uri', () => {
    let message = [
        ndef.uriRecord("http://nodejs.org")
    ];

    let encoded = ndef.encodeMessage(message);
    expect(encoded).toEqual(urlMessageNodeJSorg);

    let decodedMessage = ndef.decodeMessage(encoded);
    expect(message[0]).toEqual(decodedMessage[0]);
});

test('build and parse multiple records', () => {
    var message = [
        ndef.textRecord("hello, world"),
        ndef.uriRecord("http://nodejs.org"),
        ndef.mimeMediaRecord("text/json", '{"message": "hello, world"}')
    ];

    let encoded = ndef.encodeMessage(message);
    expect(encoded).toEqual(multipleRecordMessage);

    let decodedMessage = ndef.decodeMessage(encoded);
    expect(message[0]).toEqual(decodedMessage[0]);
    expect(message[1]).toEqual(decodedMessage[1]);
    expect(message[2]).toEqual(decodedMessage[2]);
});

