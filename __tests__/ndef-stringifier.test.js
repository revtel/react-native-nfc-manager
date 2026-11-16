const ndef = require('../ndef-lib');

describe('Ndef.stringify', () => {
  const text = ndef.textRecord('hello');
  const uri = ndef.uriRecord('https://example.com');

  test('prints a text record', () => {
    expect(ndef.stringify(text)).toBe('Text Record\nhello\n');
  });

  test('prints a URI record', () => {
    expect(ndef.stringify(uri)).toBe('URI Record\nhttps://example.com\n');
  });

  test('prints an array of records with a custom separator', () => {
    expect(ndef.stringify([text, uri], ' | ')).toBe(
      'Text Record | hello |  | URI Record | https://example.com | ',
    );
  });

  test('prints encoded message bytes without modifying the input', () => {
    const bytes = ndef.encodeMessage([text, uri]);
    const original = bytes.slice();
    expect(ndef.stringify(bytes)).toBe(
      'Text Record\nhello\n\nURI Record\nhttps://example.com\n',
    );
    expect(bytes).toEqual(original);
  });

  test('prints a Smart Poster and its nested records', () => {
    const poster = ndef.smartPoster([text, uri]);
    expect(ndef.stringify(poster)).toBe(
      'Smart Poster\nText Record\nhello\n\nURI Record\nhttps://example.com\n\n',
    );
  });

  test('prints an encoded Smart Poster', () => {
    const poster = ndef.smartPoster([text, uri]);
    expect(ndef.stringify(ndef.encodeMessage([poster]))).toBe(
      'Smart Poster\nText Record\nhello\n\nURI Record\nhttps://example.com\n\n',
    );
  });

  test('keeps empty messages and MIME records working', () => {
    expect(ndef.stringify([])).toBe('');
    expect(ndef.stringify(ndef.mimeMediaRecord('text/plain', 'hello'))).toBe(
      'MIME Media\ntext/plain\nhello\n',
    );
  });
});
