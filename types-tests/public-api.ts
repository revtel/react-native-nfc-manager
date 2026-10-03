import NfcManager, {
  NfcAdapter,
  NfcEvents,
  NfcTech,
  Ndef,
  NdefStatus,
  Nfc15693RequestFlagIOS,
  Nfc15693ResponseFlagIOS,
  NfcError,
  NfcErrorIOS,
  type CancelTechReqOpts,
  type NdefRecord,
  type RegisterTagEventOpts,
  type TagEvent,
} from 'react-native-nfc-manager';

async function smoke() {
  await NfcManager.start();
  await NfcManager.isSupported(NfcTech.Ndef);
  await NfcManager.cancelTechnologyRequest({
    throwOnError: false,
    delayMsAndroid: 500,
  } as CancelTechReqOpts);

  await NfcManager.registerTagEvent({
    alertMessage: 'Please tap NFC tags',
    isReaderModeEnabled: true,
  } as RegisterTagEventOpts);

  await NfcManager.writeNdefMessage([0xd1, 0x01, 0x00]);
  const directNdef = await NfcManager.getNdefMessage();
  const cachedNdef = await NfcManager.ndefHandler.getCachedNdefMessageAndroid();
  const backgroundNdef = await NfcManager.getBackgroundNdef();
  await NfcManager.invalidateSessionWithErrorIOS();
  await NfcManager.invalidateSessionWithErrorIOS('Unable to read tag');
  const deprecatedPush: Promise<never> = NfcManager.setNdefPushMessage([]);
  void directNdef;
  void cachedNdef;
  void backgroundNdef;
  void deprecatedPush;

  NfcManager.setEventListener(NfcEvents.DiscoverTag, (evt: TagEvent) => {
    const id = evt.id;
    const records = evt.ndefMessage ?? [];
    const writable: boolean | undefined = evt.isWritable;
    const canMakeReadOnly: boolean | null | undefined = evt.canMakeReadOnly;
    const atqa: number[] | undefined = evt.atqa;
    const sak: number | undefined = evt.sak;
    const dsfid: number | undefined = evt.dsfid;
    const responseFlags: number | undefined = evt.responseFlags;
    const hiLayerResponse: number[] | undefined = evt.hiLayerResponse;
    const tech: string | undefined = evt.tech;
    const idm: string | undefined = evt.idm;
    const systemCode: string | undefined = evt.systemCode;
    const initialSelectedAID: string | undefined = evt.initialSelectedAID;
    const historicalBytes: number[] | undefined = evt.historicalBytes;
    const applicationData: number[] | undefined = evt.applicationData;
    const icManufacturerCode: number | undefined = evt.icManufacturerCode;
    const icSerialNumber: number[] | undefined = evt.icSerialNumber;
    void id;
    void records;
    void writable;
    void canMakeReadOnly;
    void atqa;
    void sak;
    void dsfid;
    void responseFlags;
    void hiLayerResponse;
    void tech;
    void idm;
    void systemCode;
    void initialSelectedAID;
    void historicalBytes;
    void applicationData;
    void icManufacturerCode;
    void icSerialNumber;
  });

  const tagWithoutNdef: TagEvent = {id: '01234567', techTypes: ['NfcV']};
  const tagWithNdef: TagEvent = {ndefMessage: []};
  const tagWithUnknownReadOnlyCapability: TagEvent = {canMakeReadOnly: null};
  const androidCachedMetadata: TagEvent = {
    atqa: [0x44, 0x00],
    sak: 0x00,
    dsfid: 0xff,
    responseFlags: 0x80,
    historicalBytes: [0x80],
    hiLayerResponse: [0xff],
  };
  const androidRecord: NdefRecord = {id: '01', tnf: 1, type: [0x54], payload: []};
  const iosRecord: NdefRecord = {id: [0x01], tnf: 1, type: [0x54], payload: []};
  const ndefRecords = tagWithoutNdef.ndefMessage ?? [];
  // @ts-expect-error ndefMessage is absent from some native tag results
  tagWithoutNdef.ndefMessage.map((record) => record.payload);
  void tagWithNdef;
  void tagWithUnknownReadOnlyCapability;
  void androidCachedMetadata;
  void androidRecord;
  void iosRecord;
  void ndefRecords;

  NfcManager.setEventListener(NfcEvents.SessionClosed, (error) => {
    if (error instanceof NfcError.UserCancel) {
      return;
    }
    void error;
  });

  NfcManager.setEventListener(NfcEvents.StateChanged, (evt) => {
    const state = evt.state;
    void state;
  });

  await NfcManager.mifareClassicHandlerAndroid.mifareClassicGetBlockCountInSector(1);
  await NfcManager.mifareClassicHandlerAndroid.mifareClassicReadSector(1);
  await NfcManager.iso15693HandlerIOS.stayQuite();
  await NfcManager.iso15693HandlerIOS.stayQuiet();
  const blocks: number[][] =
    await NfcManager.iso15693HandlerIOS.readMultipleBlocks({
      flags: 0,
      blockNumber: 0,
      blockCount: 1,
    });
  void blocks;

  const mifareBlockSize: number = NfcManager.MIFARE_BLOCK_SIZE;
  const mifarePageSize: number = NfcManager.MIFARE_ULTRALIGHT_PAGE_SIZE;
  const mifareType: number = NfcManager.MIFARE_ULTRALIGHT_TYPE;
  const mifareTypeC: number = NfcManager.MIFARE_ULTRALIGHT_TYPE_C;
  const mifareTypeUnknown: number = NfcManager.MIFARE_ULTRALIGHT_TYPE_UNKNOWN;
  void mifareBlockSize;
  void mifarePageSize;
  void mifareType;
  void mifareTypeC;
  void mifareTypeUnknown;

  const _ = Ndef.TNF_WELL_KNOWN;
  Ndef.decodeMessage([0xd0, 0x00, 0x00]);
  Ndef.decodeMessage(new Uint8Array([0xd0, 0x00, 0x00]));
  // @ts-expect-error DataView is not a supported byte-array input.
  Ndef.decodeMessage(new DataView(new ArrayBuffer(3)));
  const __ = NdefStatus.ReadWrite;
  const ___ = NfcAdapter.FLAG_READER_NFC_A;
  const ____ = Nfc15693RequestFlagIOS.HighDataRate;
  const _____ = Nfc15693ResponseFlagIOS.FinalResponse;
  void _;
  void __;
  void ___;
  void ____;
  void _____;
  void NfcErrorIOS.errCodes.userCancel;
}

void smoke;
