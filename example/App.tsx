import React, {useEffect, useMemo, useState} from 'react';
import {
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import NfcManager, {
  NfcEvents,
  NfcTech,
  type TagEvent,
} from 'react-native-nfc-manager';

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
}

function App(): React.JSX.Element {
  const [logLines, setLogLines] = useState<string[]>([]);

  const appendLog = (message: string) => {
    setLogLines(prev => [
      `${new Date().toLocaleTimeString()}  ${message}`,
      ...prev,
    ]);
  };

  useEffect(() => {
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      appendLog(`discoverTag: ${JSON.stringify(tag)}`);
    });

    NfcManager.setEventListener(NfcEvents.SessionClosed, error => {
      appendLog(`sessionClosed: ${error ? toMessage(error) : 'no error'}`);
    });

    return () => {
      NfcManager.setEventListener(NfcEvents.DiscoverTag, null);
      NfcManager.setEventListener(NfcEvents.SessionClosed, null);
    };
  }, []);

  const actions = useMemo(
    () => [
      {
        label: 'Start NFC Manager',
        run: async () => {
          await NfcManager.start();
          appendLog('start() success');
        },
      },
      {
        label: 'Check isSupported(Ndef)',
        run: async () => {
          const supported = await NfcManager.isSupported(NfcTech.Ndef);
          appendLog(`isSupported(Ndef): ${String(supported)}`);
        },
      },
      {
        label: 'Check isEnabled()',
        run: async () => {
          const enabled = await NfcManager.isEnabled();
          appendLog(`isEnabled(): ${String(enabled)}`);
        },
      },
      {
        label: 'Request Ndef + Get Tag',
        run: async () => {
          await NfcManager.requestTechnology(NfcTech.Ndef, {
            alertMessage: 'Ready to scan NFC tag',
          });
          appendLog('requestTechnology(Ndef) success, waiting getTag()');
          const tag = await NfcManager.getTag();
          appendLog(`getTag(): ${JSON.stringify(tag)}`);
        },
      },
      {
        label: 'Request NfcA + Transceive',
        testID: 'action-request-nfca-transceive',
        run: async () => {
          await NfcManager.requestTechnology(NfcTech.NfcA, {
            alertMessage: 'Ready to scan NfcA tag',
          });
          appendLog('requestTechnology(NfcA) success, sending nfcAHandler.transceive([0x30, 0x00])');
          const response = await NfcManager.nfcAHandler.transceive([0x30, 0x00]);
          appendLog(`transceive([0x30,0x00]): ${JSON.stringify(response)}`);
        },
      },
      {
        label: 'Request Iso15693 + GetSystemInfo',
        testID: 'action-request-iso15693-systeminfo',
        run: async () => {
          await NfcManager.requestTechnology(NfcTech.Iso15693IOS, {
            alertMessage: 'Ready to scan Iso15693 tag',
          });
          appendLog('requestTechnology(Iso15693IOS) success, calling getSystemInfo(0)');
          const systemInfo = await NfcManager.iso15693HandlerIOS.getSystemInfo(0);
          appendLog(`getSystemInfo(0): ${JSON.stringify(systemInfo)}`);
        },
      },
      {
        label: 'Cancel Request',
        run: async () => {
          await NfcManager.cancelTechnologyRequest();
          appendLog('cancelTechnologyRequest() success');
        },
      },
      {
        label: 'Clear Log',
        run: async () => {
          setLogLines([]);
        },
      },
    ],
    [],
  );

  const runAction = async (run: () => Promise<void>) => {
    try {
      await run();
    } catch (error) {
      appendLog(`error: ${toMessage(error)}`);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.title}>react-native-nfc-manager example</Text>
        <Text style={styles.subtitle}>
          {Platform.OS} • RN CLI smoke test for native NFC bridge
        </Text>
      </View>

      <View style={styles.actions}>
        {actions.map(action => (
          <Pressable
            key={action.label}
            testID={action.testID}
            style={styles.button}
            onPress={() => {
              void runAction(action.run);
            }}>
            <Text style={styles.buttonText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.logContainer}>
        <Text style={styles.logTitle}>Logs</Text>
        <ScrollView contentContainerStyle={styles.logScrollContent}>
          {logLines.length === 0 ? (
            <Text style={styles.logEmpty}>No logs yet.</Text>
          ) : (
            logLines.map(line => (
              <Text key={line} style={styles.logLine}>
                {line}
              </Text>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#444',
  },
  actions: {
    paddingHorizontal: 16,
    gap: 8,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#0a84ff',
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  logContainer: {
    flex: 1,
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  logScrollContent: {
    gap: 8,
    paddingBottom: 40,
  },
  logEmpty: {
    color: '#666',
  },
  logLine: {
    fontSize: 12,
    color: '#111',
  },
});

export default App;
