import {Buffer} from 'buffer';
import {Ndef, NdefRecord} from 'react-native-nfc-manager';

const arrayRecords: NdefRecord[] = Ndef.decodeMessage([0xd0, 0x00, 0x00]);
const uint8Records: NdefRecord[] = Ndef.decodeMessage(new Uint8Array([0xd0, 0x00, 0x00]));
const bufferRecords: NdefRecord[] = Ndef.decodeMessage(Buffer.from([0xd0, 0x00, 0x00]));
// @ts-expect-error DataView is not a supported byte-array input.
Ndef.decodeMessage(new DataView(new ArrayBuffer(3)));
// @ts-expect-error Raw ArrayBuffer is not a supported byte-array input.
Ndef.decodeMessage(new ArrayBuffer(3));
void arrayRecords;
void uint8Records;
void bufferRecords;
