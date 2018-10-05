import ByteParser from './ByteParser';

test('parse byteToHexString',  () => {
  let payload = [104, 116, 116, 112, 115, 58, 47, 47, 103, 105, 116, 104, 117, 98, 46, 99, 111, 109, 47, 119, 104, 105, 116, 101, 100, 111, 103, 103, 49, 51, 47, 114, 101, 97, 99, 116, 45, 110, 97, 116, 105, 118, 101, 45, 110, 102, 99, 45, 109, 97, 110, 97, 103, 101, 114, 35, 114, 101, 97, 100, 109, 101];
  expect(ByteParser.byteToHexString(payload)).toBe("68747470733a2f2f6769746875622e636f6d2f7768697465646f676731332f72656163742d6e61746976652d6e66632d6d616e6167657223726561646d65");
});

test('parse byteToHexString should return empty',  () => {
  expect(ByteParser.byteToHexString({something: "wrong"})).toBe("");
});

test('parse byteToString',  () => {
  let payload = [104, 116, 116, 112, 115, 58, 47, 47, 103, 105, 116, 104, 117, 98, 46, 99, 111, 109, 47, 119, 104, 105, 116, 101, 100, 111, 103, 103, 49, 51, 47, 114, 101, 97, 99, 116, 45, 110, 97, 116, 105, 118, 101, 45, 110, 102, 99, 45, 109, 97, 110, 97, 103, 101, 114, 35, 114, 101, 97, 100, 109, 101];
  expect(ByteParser.byteToString(payload)).toBe("https://github.com/whitedogg13/react-native-nfc-manager#readme");
});

test('parse byteToString should return empty',  () => {
  expect(ByteParser.byteToString({something: "wrong"})).toBe("");
});
