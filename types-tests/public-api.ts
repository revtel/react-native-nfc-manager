import NfcManager, {
  NfcEvents,
  NfcTech,
  Ndef,
  NfcError,
  NfcErrorIOS,
  type TagEvent,
} from 'react-native-nfc-manager';

async function smoke() {
  await NfcManager.start();
  await NfcManager.isSupported(NfcTech.Ndef);
  await NfcManager.cancelTechnologyRequest({
    throwOnError: false,
    delayMsAndroid: 500,
  });

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
  void _;
  void NfcErrorIOS.errCodes.userCancel;
}

void smoke;
