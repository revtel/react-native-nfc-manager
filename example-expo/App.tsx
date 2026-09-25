import React, {useEffect, useRef, useState} from 'react';
import {Platform, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import NfcManager, {NfcEvents, type TagEvent} from 'react-native-nfc-manager';
import {cancelPendingNdef, errorText, readNdef, readNfcA, startNfc} from './flows';

export default function App(): React.JSX.Element {
  const [lines, setLines] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [tagEventActive, setTagEventActive] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const busyRef = useRef(false);
  const log = (message: string) => {
    setLines(current => [...current, `${new Date().toLocaleTimeString()}  ${message}`]);
  };

  useEffect(() => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      log(`discoverTag: ${JSON.stringify(tag)}`);
      if (Platform.OS === 'android') {
        void NfcManager.unregisterTagEvent().then(
          () => {
            log('unregisterTagEvent(one-shot) success');
            setTagEventActive(false);
          },
          error => log(`unregisterTagEvent(one-shot) error: ${errorText(error)}`),
        );
      }
    });
    NfcManager.setEventListener(NfcEvents.SessionClosed, error => {
      log(`sessionClosed: ${error ? errorText(error) : 'no error'}`);
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
    try {
      await NfcManager.registerTagEvent({
        alertMessage: 'Scan an NFC tag',
        invalidateAfterFirstRead: true,
      });
      log('registerTagEvent(one-shot) success; scan a tag');
      setTagEventActive(true);
    } catch (error) {
      log(`registerTagEvent error: ${errorText(error)}`);
    }
  };
  const stopTagEvent = async () => {
    try {
      await NfcManager.unregisterTagEvent();
      log('unregisterTagEvent() success');
      setTagEventActive(false);
    } catch (error) {
      log(`unregisterTagEvent error: ${errorText(error)}`);
    }
  };

  const actions: Array<[string, () => Promise<void>, boolean, boolean]> = [
    ['Start + support checks', () => startNfc(log), true, !tagEventActive],
    ['Read NDEF', () => readNdef(log), true, !tagEventActive],
    ['Cancel pending NDEF (2.5s)', () => cancelPendingNdef(log), true, !tagEventActive],
    [tagEventActive ? 'Stop one-shot event' : 'One-shot tag event', tagEventActive ? stopTagEvent : beginTagEvent, true, true],
    ['Android NfcA transceive', () => readNfcA(log), Platform.OS === 'android', !tagEventActive],
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
        <View style={styles.pane}>
          <Text style={styles.heading}>Actions</Text>
          <ScrollView style={styles.scroll} testID="smoke-actions">
            {actions.filter(([, , visible]) => visible).map(([label, action, , enabled]) => (
              <Pressable
                accessibilityRole="button"
                disabled={busy || !enabled}
                key={label}
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
});
