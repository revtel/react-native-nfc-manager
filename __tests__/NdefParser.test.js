import NdefParser from '../src/NdefParser';

test('parse RTD_TEXT', () => {
  let RTD_TEXT_TYPE = [0x54];
  let record = {
    tnf: 1,
    type: RTD_TEXT_TYPE,
    payload: [
      0x02, 0x65, 0x6e, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 
      0x2c, 0x20, 0x77, 0x6f, 0x72, 0x6c, 0x64, 0x21,
    ]
  };

  let result = NdefParser.parseText(record);
  let answer = "hello, world!";

  expect(result).toBe(answer);
});

test('parse RTD_URI', () => {
  let RTD_URI_TYPE = [0x55];
  let record = {
    tnf: 1,
    type: RTD_URI_TYPE,
    payload: [
      0x01, 0x67, 0x6f, 0x6f, 0x67, 0x6c, 0x65, 0x2e, 
      0x63, 0x6f, 0x6d,
    ]
  };

  let {uri: result} = NdefParser.parseUri(record);
  let answer = "http://www.google.com";

  expect(result).toBe(answer);
});
