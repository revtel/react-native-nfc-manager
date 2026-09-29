import React, {useEffect, useRef, useState} from 'react';
import {Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import NfcManager, {NfcEvents, type TagEvent} from 'react-native-nfc-manager';
import {cancelPendingNdef, errorText, readNdef, readNfcA, startNfc, type TechnologySession} from './flows';

type ScanPrompt = {
  id: number;
  message: string;
  phase: 'waiting' | 'connected' | 'cancelling';
  resumePhase: 'waiting' | 'connected';
};

export default function App(): React.JSX.Element {
  const [lines, setLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [tagEventActive, setTagEventActive] = useState(false);
  const [androidPrompt, setAndroidPrompt] = useState<ScanPrompt | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const busyRef = useRef(false);
  const promptIdRef = useRef(0);
  const cancellationRef = useRef<Promise<void> | null>(null);
  const tagEventActiveRef = useRef(false);
  const registrationRef = useRef<Promise<void> | null>(null);
  const log = (message: string) => {
    setLines(current => [...current, `${new Date().toLocaleTimeString()}  ${message}`]);
  };

  const showPrompt = (message: string) => {
    const id = ++promptIdRef.current;
    cancellationRef.current = null;
    if (Platform.OS === 'android') {
      setAndroidPrompt({id, message, phase: 'waiting', resumePhase: 'waiting'});
    }
    return id;
  };

  const closeAndroidSession = (): Promise<void> => {
    if (cancellationRef.current) {
      return cancellationRef.current;
    }
    const id = promptIdRef.current;
    setAndroidPrompt(current => current?.id === id
      ? {...current, phase: 'cancelling'} : current);
    const cancellation = (async () => {
      try {
        if (tagEventActiveRef.current) {
          await registrationRef.current;
          await NfcManager.unregisterTagEvent();
          tagEventActiveRef.current = false;
          setTagEventActive(false);
          log('unregisterTagEvent(one-shot) success');
        } else {
          await NfcManager.cancelTechnologyRequest({throwOnError: true});
        }
        setAndroidPrompt(current => current?.id === id ? null : current);
      } catch (error) {
        cancellationRef.current = null;
        setAndroidPrompt(current => current?.id === id
          ? {...current, phase: current.resumePhase} : current);
        throw error;
      }
    })();
    cancellationRef.current = cancellation;
    return cancellation;
  };

  const session: TechnologySession = {
    requestTechnology: async (tech, options) => {
      const id = showPrompt(options?.alertMessage ?? 'Scan an NFC tag');
      const result = await NfcManager.requestTechnology(tech, options);
      setAndroidPrompt(current => current?.id === id && current.phase === 'waiting'
        ? {...current, phase: 'connected', resumePhase: 'connected'} : current);
      return result;
    },
    cancelTechnologyRequest: () => Platform.OS === 'android'
      ? closeAndroidSession() : NfcManager.cancelTechnologyRequest(),
  };

  const cancelAndroidPrompt = async () => {
    try {
      await closeAndroidSession();
      log('Android scan prompt closed');
    } catch (error) {
      log(`Android scan prompt cancel error: ${errorText(error)}`);
    }
  };

  useEffect(() => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      log(`discoverTag: ${JSON.stringify(tag)}`);
      if (Platform.OS === 'android' && tagEventActiveRef.current) {
        void closeAndroidSession().catch(error =>
          log(`unregisterTagEvent(one-shot) error: ${errorText(error)}`),
        );
      }
    });
    NfcManager.setEventListener(NfcEvents.SessionClosed, error => {
      log(`sessionClosed: ${error ? errorText(error) : 'no error'}`);
      tagEventActiveRef.current = false;
      setTagEventActive(false);
    });
    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    };
  }, []);

  const run = async (action: () => Promise<void>) => {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await action();
    } catch (error) {
      log(`unexpected error: ${errorText(error)}`);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const beginTagEvent = async () => {
    const id = showPrompt('Scan one NDEF tag');
    tagEventActiveRef.current = true;
    try {
      registrationRef.current = NfcManager.registerTagEvent({
        alertMessage: 'Scan an NFC tag',
        invalidateAfterFirstRead: true,
      });
      await registrationRef.current;
      log('registerTagEvent(one-shot) success; scan a tag');
      setTagEventActive(tagEventActiveRef.current);
    } catch (error) {
      tagEventActiveRef.current = false;
      setTagEventActive(false);
      setAndroidPrompt(current => current?.id === id ? null : current);
      log(`registerTagEvent error: ${errorText(error)}`);
    }
  };
  const stopTagEvent = async () => {
    try {
      if (Platform.OS === 'android') {
        await closeAndroidSession();
      } else {
        await NfcManager.unregisterTagEvent();
        tagEventActiveRef.current = false;
      }
      log('unregisterTagEvent() success');
      setTagEventActive(false);
    } catch (error) {
      log(`unregisterTagEvent error: ${errorText(error)}`);
    }
  };

  const actions: Array<[string, () => Promise<void>, boolean, boolean]> = [
    ['Start + support checks', () => startNfc(log), true, !tagEventActive],
    ['Read NDEF', () => readNdef(log, session), true, !tagEventActive],
    ['Cancel pending NDEF (2.5s)', () => cancelPendingNdef(log, 2500, 2000, session), true, !tagEventActive],
    [tagEventActive ? 'Stop one-shot event' : 'One-shot tag event', tagEventActive ? stopTagEvent : beginTagEvent, true, true],
    ['Android NfcA transceive', () => readNfcA(log, session), Platform.OS === 'android', !tagEventActive],
  ];

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Text style={styles.title}>Expo NFC device smoke test</Text>
        <Text style={styles.caption}>Packed local candidate · {Platform.OS} · {busy ? 'busy' : 'ready'}</Text>
        <View style={styles.pane}>
          <Text style={styles.heading}>Log (oldest → newest)</Text>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            testID="smoke-log"
            onContentSizeChange={() => scrollRef.current?.scrollToEnd({animated: false})}>
            {lines.map((line, index) => <Text key={index} style={styles.logLine}>{line}</Text>)}
          </ScrollView>
        </View>
        <Modal
          testID="android-nfc-scan-modal"
          animationType="fade"
          navigationBarTranslucent
          statusBarTranslucent
          transparent
          visible={Platform.OS === 'android' && androidPrompt !== null}
          onRequestClose={() => {
            if (androidPrompt?.phase !== 'cancelling') {
              void cancelAndroidPrompt();
            }
          }}>
          <View style={styles.promptBackdrop}>
            <View accessibilityViewIsModal style={styles.promptCard} testID="android-nfc-scan-prompt">
              <Text style={styles.promptTitle}>
                {androidPrompt?.phase === 'cancelling' ? 'Closing NFC Session'
                  : androidPrompt?.phase === 'connected' ? 'Tag Connected' : 'Ready to Scan'}
              </Text>
              <Text style={styles.promptMessage}>
                {androidPrompt?.phase === 'cancelling' ? 'Finishing cleanup. Please wait.'
                  : androidPrompt?.phase === 'connected' ? 'Reading the tag. Keep it near your phone.'
                  : androidPrompt?.message}
              </Text>
              {androidPrompt?.phase === 'waiting' && (
                <Text style={styles.promptMessage}>Hold the NFC tag near the back of your device.</Text>
              )}
              <Pressable
                testID="android-nfc-scan-prompt-cancel"
                accessibilityRole="button"
                disabled={androidPrompt?.phase === 'cancelling'}
                onPress={() => void cancelAndroidPrompt()}
                style={[styles.button, androidPrompt?.phase === 'cancelling' && styles.disabled]}>
                <Text style={styles.buttonText}>
                  {androidPrompt?.phase === 'cancelling' ? 'Closing…' : 'Cancel'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
        <View style={styles.pane}>
          <Text style={styles.heading}>Actions</Text>
          <ScrollView style={styles.scroll} testID="smoke-actions">
            {actions.filter(([, , visible]) => visible).map(([label, action, , enabled]) => (
              <Pressable
                accessibilityRole="button"
                disabled={busy || !enabled}
                key={label}
                testID={label}
                onPress={() => void run(action)}
                style={[styles.button, (busy || !enabled) && styles.disabled]}>
                <Text style={styles.buttonText}>{label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#101827', paddingHorizontal: 14},
  title: {fontSize: 19, fontWeight: '700', color: '#fff', marginTop: 8},
  caption: {color: '#b8c6d9', marginBottom: 8},
  pane: {flex: 1, marginVertical: 5, padding: 10, borderRadius: 10, backgroundColor: '#1d2b40'},
  scroll: {flex: 1},
  heading: {fontWeight: '700', color: '#e7f0ff', marginBottom: 8},
  logLine: {fontFamily: 'monospace', color: '#dbe9ff', marginBottom: 6},
  button: {backgroundColor: '#2960a3', borderRadius: 8, padding: 14, marginBottom: 9},
  disabled: {opacity: 0.5},
  buttonText: {color: '#fff', fontWeight: '600'},
  promptBackdrop: {flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: 24},
  promptCard: {backgroundColor: '#1d2b40', borderRadius: 16, padding: 24},
  promptTitle: {fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16},
  promptMessage: {color: '#dbe9ff', marginBottom: 16},
});
