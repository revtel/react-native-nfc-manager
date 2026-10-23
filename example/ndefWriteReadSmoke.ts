import NfcManager, { Ndef, NdefStatus, type TagEvent } from 'react-native-nfc-manager';

export type WrittenNdef = { tagId: string; text: string };

export function assertWrittenText(tag: TagEvent | null, text: string) {
  const expected = Ndef.textRecord(text);
  const typeBytes = (type: number[] | string | undefined) =>
    typeof type === 'string' ? Array.from(type, character => character.charCodeAt(0)) : type;
  const records = tag?.ndefMessage;
  const record = records?.[0];
  if (
    records?.length !== 1 ||
    record?.tnf !== expected.tnf ||
    JSON.stringify(typeBytes(record?.type)) !== JSON.stringify(typeBytes(expected.type)) ||
    JSON.stringify(record?.payload) !== JSON.stringify(expected.payload)
  ) {
    throw new Error(`NDEF readback mismatch; expected ${text}, got ${JSON.stringify(records)}`);
  }
}

// The caller owns one connected Ndef request and its cleanup.
export async function writeReadSameSession(log: (message: string) => void): Promise<WrittenNdef> {
  // Use discovery metadata for preflight. A live read of an empty tag can
  // change some Android NFC stacks' NDEF state before the first write.
  const before = await NfcManager.getTag();
  log(`before (cached discovery): ${JSON.stringify(before)}`);
  if (!before?.id) {
    throw new Error('Cannot identify the connected NDEF tag');
  }
  const status = await NfcManager.ndefHandler.getNdefStatus();
  log(`status: ${JSON.stringify(status)}`);
  const texts = ['A', 'B'].map(suffix => `NFC843-${Date.now()}-${suffix}`);
  const messages = texts.map(text => Ndef.encodeMessage([Ndef.textRecord(text)]));
  if (status.status !== NdefStatus.ReadWrite || messages.some(bytes => bytes.length > status.capacity)) {
    throw new Error('Tag is not writable or has insufficient NDEF capacity');
  }
  for (let index = 0; index < texts.length; index++) {
    await NfcManager.ndefHandler.writeNdefMessage(messages[index], { reconnectAfterWrite: false });
    log(`wrote: ${texts[index]}`);
    const actual = await NfcManager.ndefHandler.getNdefMessage();
    log(`live read: ${JSON.stringify(actual)}`);
    if (actual?.id !== before.id) {
      throw new Error('Tag identity changed during the write/read test');
    }
    assertWrittenText(actual, texts[index]);
    log(`PASS same-session ${index + 1}/2: ${texts[index]}`);
  }
  return { tagId: before.id, text: texts[1] };
}

export async function verifySavedNdef(expected: WrittenNdef, log: (message: string) => void) {
  const actual = await NfcManager.ndefHandler.getNdefMessage();
  log(`re-scan: ${JSON.stringify(actual)}`);
  if (actual?.id !== expected.tagId) {
    throw new Error('Scan the same tag used for the write/read test');
  }
  assertWrittenText(actual, expected.text);
  log(`PASS saved content: ${expected.text}`);
}
