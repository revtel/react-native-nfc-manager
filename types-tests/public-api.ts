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

  NfcManager.setEventListener(NfcEvents.DiscoverTag, (evt: TagEvent) => {
    const id = evt.id;
    void id;
  });

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

  const _ = Ndef.TNF_WELL_KNOWN;
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
