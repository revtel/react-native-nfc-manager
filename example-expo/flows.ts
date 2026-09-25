import {Platform} from 'react-native';
import NfcManager, {NfcTech} from 'react-native-nfc-manager';

export type Log = (message: string) => void;

export function errorText(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.name;
  }
  return typeof error === 'string' ? error : JSON.stringify(error);
}

async function cancelAndLog(log: Log): Promise<void> {
  try {
    await NfcManager.cancelTechnologyRequest();
    log('cancelTechnologyRequest() success');
  } catch (error) {
    log(`cancelTechnologyRequest() error: ${errorText(error)}`);
  }
}

export async function startNfc(log: Log): Promise<void> {
  try {
    await NfcManager.start();
    log('start() success');
    log(`isSupported(Ndef): ${await NfcManager.isSupported(NfcTech.Ndef)}`);
    log(`isEnabled(): ${await NfcManager.isEnabled()}`);
  } catch (error) {
    log(`start/check error: ${errorText(error)}`);
  }
}

export async function readNdef(log: Log): Promise<void> {
  try {
    log('requestTechnology(Ndef) pending; scan a tag');
    await NfcManager.requestTechnology(NfcTech.Ndef, {
      alertMessage: 'Scan an NDEF tag',
    });
    log('requestTechnology(Ndef) success');
    log(`getTag(): ${JSON.stringify(await NfcManager.getTag())}`);
  } catch (error) {
    log(`NDEF error: ${errorText(error)}`);
  } finally {
    await cancelAndLog(log);
  }
}

export async function cancelPendingNdef(
  log: Log,
  delay = 2500,
  settleTimeout = 2000,
): Promise<void> {
  log('requestTechnology(Ndef) pending; cancel in 2.5 seconds');
  const request = NfcManager.requestTechnology(NfcTech.Ndef, {
    alertMessage: 'Cancellation test: wait without scanning',
  }).then(
    () => log('requestTechnology(Ndef) resolved before cancellation'),
    error => log(`requestTechnology(Ndef) rejected: ${errorText(error)}`),
  );
  await new Promise<void>(resolve => setTimeout(resolve, delay));
  await cancelAndLog(log);
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const didNotSettle = new Promise<void>(resolve => {
    timeout = setTimeout(() => {
      log('requestTechnology(Ndef) did not settle after cancellation');
      resolve();
    }, settleTimeout);
  });
  try {
    await Promise.race([request, didNotSettle]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function readNfcA(log: Log): Promise<void> {
  if (Platform.OS !== 'android') {
    log('NfcA transceive is Android-only');
    return;
  }
  try {
    log('requestTechnology(NfcA) pending; scan a compatible tag');
    await NfcManager.requestTechnology(NfcTech.NfcA);
    log('requestTechnology(NfcA) success');
    const response = await NfcManager.nfcAHandler.transceive([0x30, 0x00]);
    log(`transceive([0x30,0x00]): ${JSON.stringify(response)}`);
  } catch (error) {
    log(`NfcA error: ${errorText(error)}`);
  } finally {
    await cancelAndLog(log);
  }
}
