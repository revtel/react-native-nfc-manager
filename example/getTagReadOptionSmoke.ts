import { Platform } from 'react-native';
import NfcManager from 'react-native-nfc-manager';

// NXP NTAG213/215/216 datasheet, READ/PWD_AUTH command tables 29 and 39:
// https://www.nxp.com/docs/en/data-sheet/NTAG213_215_216.pdf
// The caller owns the connected MifareIOS/NfcA request and its cleanup.
// This checks a READ starting at page 4, not the tag's protection boundaries.
export async function verifyNtag215ReadOption(
  passwordHex: string,
  log: (line: string) => void,
): Promise<void> {
  if (passwordHex.length !== 8 || !/^[0-9a-fA-F]{8}$/.test(passwordHex)) {
    throw new Error('Enter the known tag password as exactly 8 hexadecimal characters');
  }
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    throw new Error('This NTAG215 check requires iOS or Android');
  }

  for (let index = 0; index < 2; index++) {
    let tag;
    try {
      tag = await NfcManager.getTag({ readNdef: false });
    } catch {
      throw new Error('Tag metadata retrieval failed before authentication');
    }
    if (!tag?.id) {
      throw new Error('Tag metadata is unavailable before authentication');
    }
    if (Platform.OS === 'ios' && 'ndefMessage' in tag) {
      throw new Error('The iOS metadata-only result unexpectedly contains NDEF content');
    }
    log(`PASS metadata without NDEF read ${index + 1}/2: id=${tag.id}`);
  }

  const send = (bytes: number[]) => Platform.OS === 'ios'
    ? NfcManager.sendMifareCommandIOS(bytes)
    : NfcManager.nfcAHandler.transceive(bytes);
  const password = Array.from({ length: 4 }, (_, index) =>
    parseInt(passwordHex.slice(index * 2, index * 2 + 2), 16),
  );

  let pack: number[];
  try {
    pack = await send([0x1b, ...password]);
  } catch {
    throw new Error('NTAG215 authentication failed; no retry was attempted');
  }
  if (!Array.isArray(pack) || pack.length !== 2) {
    throw new Error('NTAG215 authentication did not return a 2-byte acknowledgement');
  }
  log('PASS authentication acknowledgement: 2 bytes');

  let data: number[];
  try {
    data = await send([0x30, 0x04]);
  } catch {
    throw new Error('NTAG215 page 4 read failed after authentication');
  }
  if (!Array.isArray(data) || data.length !== 16) {
    throw new Error('NTAG215 page 4 read did not return 16 bytes');
  }
  log('PASS page 4 read after authentication: 16 bytes; protection range not checked');
}
