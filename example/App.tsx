import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  initialWindowMetrics,
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';
import NfcManager, {
  NfcEvents,
  NfcTech,
  type TagEvent,
} from 'react-native-nfc-manager';

function toMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message || error.constructor.name;
  }
  if (typeof error === 'string') {
    return error;
  }
  return JSON.stringify(error);
}

const wait = (milliseconds: number) =>
  new Promise<void>(resolve => setTimeout(resolve, milliseconds));

const initialSafeAreaMetrics = initialWindowMetrics ?? {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

type RequestOutcome =
  | { status: 'resolved' }
  | { status: 'rejected'; error: unknown };

function observeRequest(request: Promise<unknown>): Promise<RequestOutcome> {
  return request.then(
    () => ({ status: 'resolved' }),
    error => ({ status: 'rejected', error }),
  );
}

function App(): React.JSX.Element {
  const [logLines, setLogLines] = useState<string[]>([]);
  const [androidPrompt, setAndroidPrompt] = useState<{
    id: number;
    message: string;
    phase: 'waiting' | 'connected' | 'cancelling';
    resumePhase: 'waiting' | 'connected';
  } | null>(null);
  const logScrollRef = useRef<ScrollView>(null);
  const androidPromptIdRef = useRef(0);

  const appendLog = (message: string) => {
    setLogLines(prev => [
      ...prev,
      `${new Date().toLocaleTimeString()}  ${message}`,
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

  const requestTechnologyWithPrompt = async <T,>(
    message: string,
    request: () => Promise<T>,
  ): Promise<T> => {
    if (Platform.OS !== 'android') {
      return request();
    }

    const id = ++androidPromptIdRef.current;
    setAndroidPrompt({
      id,
      message,
      phase: 'waiting',
      resumePhase: 'waiting',
    });

    try {
      const result = await request();
      setAndroidPrompt(current =>
        current?.id === id
          ? { ...current, phase: 'connected', resumePhase: 'connected' }
          : current,
      );
      return result;
    } catch (error) {
      setAndroidPrompt(current =>
        current?.id === id && current.phase !== 'cancelling' ? null : current,
      );
      throw error;
    }
  };

  const cancelTechnologyWithPrompt = async () => {
    setAndroidPrompt(current =>
      current ? { ...current, phase: 'cancelling' } : current,
    );

    try {
      await NfcManager.cancelTechnologyRequest();
      setAndroidPrompt(null);
    } catch (error) {
      setAndroidPrompt(current =>
        current ? { ...current, phase: current.resumePhase } : current,
      );
      throw error;
    }
  };

  const cancelAndroidPrompt = async () => {
    try {
      await cancelTechnologyWithPrompt();
      appendLog('Android scan prompt cancelTechnologyRequest() success');
    } catch (error) {
      appendLog(`Android scan prompt cancel error: ${toMessage(error)}`);
    }
  };

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
        testID: 'action-request-ndef-get-tag',
        run: async () => {
          await requestTechnologyWithPrompt('Ready to scan NFC tag', () =>
            NfcManager.requestTechnology(NfcTech.Ndef, {
              alertMessage: 'Ready to scan NFC tag',
            }),
          );
          appendLog('requestTechnology(Ndef) success, waiting getTag()');
          const tag = await NfcManager.getTag();
          appendLog(`getTag(): ${JSON.stringify(tag)}`);
        },
      },
      {
        label: 'Register One-shot NDEF Event',
        testID: 'action-register-one-shot-ndef-event',
        run: async () => {
          await NfcManager.registerTagEvent({
            alertMessage: 'Ready to scan one NDEF tag',
            invalidateAfterFirstRead: true,
          });
          appendLog('registerTagEvent(one-shot) success');
        },
      },
      {
        label: 'Request Ndef + Auto Cancel',
        testID: 'action-request-ndef-auto-cancel',
        run: async () => {
          const requestOutcome = observeRequest(
            requestTechnologyWithPrompt(
              'Cancellation test: this should close automatically',
              () =>
                NfcManager.requestTechnology(NfcTech.Ndef, {
                  alertMessage:
                    'Cancellation test: this should close automatically',
                }),
            ),
          );

          await wait(1500);
          await cancelTechnologyWithPrompt();
          appendLog('auto cancelTechnologyRequest() success');

          const outcome = await requestOutcome;
          if (outcome.status === 'resolved') {
            appendLog('auto-cancel request unexpectedly resolved');
          } else {
            appendLog(
              `auto-cancel request rejected: ${toMessage(outcome.error)}`,
            );
          }
        },
      },
      {
        label: 'Test Removed DiscoverTag Listener',
        testID: 'action-test-removed-discover-tag-listener',
        run: async () => {
          NfcManager.setEventListener(NfcEvents.DiscoverTag, null);

          if (Platform.OS === 'android') {
            await NfcManager.registerTagEvent();
            appendLog(
              'DiscoverTag listener removed; scan once within 8 seconds',
            );
            await wait(8000);
            await NfcManager.unregisterTagEvent();
            appendLog('removed-listener observation complete: no callback');

            NfcManager.setEventListener(
              NfcEvents.DiscoverTag,
              (tag: TagEvent) => {
                appendLog(
                  `listener-restored discoverTag: ${JSON.stringify(tag)}`,
                );
                NfcManager.setEventListener(
                  NfcEvents.DiscoverTag,
                  (nextTag: TagEvent) => {
                    appendLog(`discoverTag: ${JSON.stringify(nextTag)}`);
                  },
                );
                void NfcManager.unregisterTagEvent().then(
                  () => appendLog('listener-restored event cleanup success'),
                  error =>
                    appendLog(
                      `listener-restored event cleanup error: ${toMessage(
                        error,
                      )}`,
                    ),
                );
              },
            );
            await NfcManager.registerTagEvent();
            appendLog('DiscoverTag listener restored; scan once');
            return;
          }

          NfcManager.setEventListener(NfcEvents.SessionClosed, error => {
            appendLog(
              `listener-removal sessionClosed: ${
                error ? toMessage(error) : 'no error'
              }`,
            );
            appendLog('removed DiscoverTag listener received no callback');

            NfcManager.setEventListener(
              NfcEvents.DiscoverTag,
              (tag: TagEvent) => {
                appendLog(`discoverTag: ${JSON.stringify(tag)}`);
              },
            );
            NfcManager.setEventListener(
              NfcEvents.SessionClosed,
              sessionError => {
                appendLog(
                  `sessionClosed: ${
                    sessionError ? toMessage(sessionError) : 'no error'
                  }`,
                );
              },
            );
            appendLog('default event listeners restored');
          });

          await NfcManager.registerTagEvent({
            alertMessage: 'Listener-removal test: scan one NDEF tag',
            invalidateAfterFirstRead: true,
          });
          appendLog('DiscoverTag listener removed; scan the tag');
        },
      },
      {
        label: 'Request NfcA + Transceive',
        testID: 'action-request-nfca-transceive',
        run: async () => {
          await requestTechnologyWithPrompt('Ready to scan NfcA tag', () =>
            NfcManager.requestTechnology(NfcTech.NfcA, {
              alertMessage: 'Ready to scan NfcA tag',
            }),
          );
          appendLog(
            'requestTechnology(NfcA) success, sending nfcAHandler.transceive([0x30, 0x00])',
          );
          const response = await NfcManager.nfcAHandler.transceive([
            0x30, 0x00,
          ]);
          appendLog(`transceive([0x30,0x00]): ${JSON.stringify(response)}`);
        },
      },
      Platform.OS === 'android'
        ? {
            label: 'Test Repeated Ndef Request + Recovery',
            testID: 'action-test-repeated-request-recovery',
            run: async () => {
              const firstOutcome = observeRequest(
                requestTechnologyWithPrompt(
                  'Repeated request test: do not scan yet',
                  () =>
                    NfcManager.requestTechnology(NfcTech.Ndef, {
                      alertMessage: 'Repeated request test: do not scan yet',
                    }),
                ),
              );

              await wait(250);
              const secondOutcome = await observeRequest(
                NfcManager.requestTechnology(NfcTech.Ndef, {
                  alertMessage: 'This repeated request should be rejected',
                }),
              );

              if (secondOutcome.status === 'resolved') {
                appendLog('second repeated request unexpectedly resolved');
              } else {
                appendLog(
                  `second repeated request rejected: ${toMessage(
                    secondOutcome.error,
                  )}`,
                );
              }

              await cancelTechnologyWithPrompt();
              appendLog('first repeated request cleanup success');

              const firstTerminalOutcome = await firstOutcome;
              if (firstTerminalOutcome.status === 'resolved') {
                appendLog('first repeated request unexpectedly resolved');
              } else {
                appendLog(
                  `first repeated request rejected: ${toMessage(
                    firstTerminalOutcome.error,
                  )}`,
                );
              }

              appendLog('starting repeated-request recovery; scan the tag');
              await requestTechnologyWithPrompt(
                'Repeated-request recovery: scan the NDEF tag',
                () =>
                  NfcManager.requestTechnology(NfcTech.Ndef, {
                    alertMessage:
                      'Repeated-request recovery: scan the NDEF tag',
                  }),
              );
              appendLog('repeated-request recovery connected');
              const tag = await NfcManager.getTag();
              appendLog(
                `repeated-request recovery getTag(): ${JSON.stringify(tag)}`,
              );
            },
          }
        : {
            label: 'Test Ndef Timeout + Recovery',
            testID: 'action-test-ndef-timeout-recovery',
            run: async () => {
              const timeoutOutcome = await observeRequest(
                requestTechnologyWithPrompt(
                  'Timeout test: do not scan a tag',
                  () =>
                    NfcManager.requestTechnology(NfcTech.Ndef, {
                      alertMessage: 'Timeout test: do not scan a tag',
                    }),
                ),
              );

              if (timeoutOutcome.status === 'resolved') {
                appendLog('timeout request unexpectedly resolved');
                await cancelTechnologyWithPrompt();
                return;
              }

              appendLog(
                `timeout request rejected: ${toMessage(timeoutOutcome.error)}`,
              );
              appendLog('timeout cleanup completed; waiting for Core NFC UI');
              await wait(1000);
              appendLog('starting timeout recovery; scan the tag');

              await requestTechnologyWithPrompt(
                'Timeout recovery: scan the NDEF tag',
                () =>
                  NfcManager.requestTechnology(NfcTech.Ndef, {
                    alertMessage: 'Timeout recovery: scan the NDEF tag',
                  }),
              );
              appendLog('timeout recovery request connected');
              const tag = await NfcManager.getTag();
              appendLog(`timeout recovery getTag(): ${JSON.stringify(tag)}`);
            },
          },
      Platform.OS === 'android'
        ? {
            label: 'Test Failed NfcA I/O + Recovery',
            testID: 'action-test-failed-io-recovery',
            run: async () => {
              await requestTechnologyWithPrompt(
                'Failed I/O test: scan the NfcA tag',
                () =>
                  NfcManager.requestTechnology(NfcTech.NfcA, {
                    alertMessage: 'Failed I/O test: scan the NfcA tag',
                  }),
              );
              appendLog(
                'failed-I/O NfcA connected; sending malformed transceive([0x30])',
              );

              const ioOutcome = await observeRequest(
                NfcManager.nfcAHandler.transceive([0x30]),
              );
              if (ioOutcome.status === 'resolved') {
                appendLog('malformed transceive unexpectedly resolved');
              } else {
                appendLog(
                  `malformed transceive rejected: ${toMessage(
                    ioOutcome.error,
                  )}`,
                );
              }

              await cancelTechnologyWithPrompt();
              appendLog('failed-I/O cleanup success');
              appendLog('starting failed-I/O recovery; scan the NDEF tag');

              await requestTechnologyWithPrompt(
                'Failed-I/O recovery: scan the NDEF tag',
                () =>
                  NfcManager.requestTechnology(NfcTech.Ndef, {
                    alertMessage: 'Failed-I/O recovery: scan the NDEF tag',
                  }),
              );
              appendLog('failed-I/O recovery connected');
              const tag = await NfcManager.getTag();
              appendLog(
                `failed-I/O recovery getTag(): ${JSON.stringify(tag)}`,
              );
            },
          }
        : {
            label: 'Request Iso15693 + GetSystemInfo',
            testID: 'action-request-iso15693-systeminfo',
            run: async () => {
              await requestTechnologyWithPrompt(
                'Ready to scan Iso15693 tag',
                () =>
                  NfcManager.requestTechnology(NfcTech.Iso15693IOS, {
                    alertMessage: 'Ready to scan Iso15693 tag',
                  }),
              );
              appendLog(
                'requestTechnology(Iso15693IOS) success, calling getSystemInfo(0)',
              );
              const systemInfo =
                await NfcManager.iso15693HandlerIOS.getSystemInfo(0);
              appendLog(`getSystemInfo(0): ${JSON.stringify(systemInfo)}`);
            },
          },
      {
        label: 'Cancel Request',
        run: async () => {
          await cancelTechnologyWithPrompt();
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
    <SafeAreaProvider initialMetrics={initialSafeAreaMetrics}>
      <SafeAreaView
        edges={['top', 'right', 'bottom', 'left']}
        mode="padding"
        style={styles.screen}
      >
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.title}>react-native-nfc-manager example</Text>
          <Text style={styles.subtitle}>
            {Platform.OS} • RN CLI smoke test for native NFC bridge
          </Text>
        </View>

        <View style={styles.splitContent}>
          <View style={styles.logContainer}>
            <Text style={styles.sectionTitle}>Logs</Text>
            <ScrollView
              ref={logScrollRef}
              contentContainerStyle={styles.logScrollContent}
              onContentSizeChange={() => {
                logScrollRef.current?.scrollToEnd({ animated: true });
              }}
            >
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

          <View style={styles.actionsContainer}>
            <Text style={styles.sectionTitle}>Test Actions</Text>
            <ScrollView contentContainerStyle={styles.actionsScrollContent}>
              {actions.map(action => (
                <Pressable
                  key={action.label}
                  testID={action.testID}
                  style={styles.button}
                  onPress={() => {
                    void runAction(action.run);
                  }}
                >
                  <Text style={styles.buttonText}>{action.label}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <Modal
          animationType="fade"
          navigationBarTranslucent
          onRequestClose={() => {
            void cancelAndroidPrompt();
          }}
          statusBarTranslucent
          transparent
          visible={Platform.OS === 'android' && androidPrompt !== null}
        >
          <View style={styles.androidPromptBackdrop}>
            <View
              accessibilityViewIsModal
              style={styles.androidPromptCard}
              testID="android-nfc-scan-prompt"
            >
              <Text style={styles.androidPromptIcon}>⌁</Text>
              <Text style={styles.androidPromptTitle}>
                {androidPrompt?.phase === 'connected'
                  ? 'Tag Connected'
                  : androidPrompt?.phase === 'cancelling'
                  ? 'Closing NFC Session'
                  : 'Ready to Scan'}
              </Text>
              <Text style={styles.androidPromptMessage}>
                {androidPrompt?.phase === 'connected'
                  ? 'The NFC tag is connected and ready for operations.'
                  : androidPrompt?.phase === 'cancelling'
                  ? 'Finishing the active NFC operation…'
                  : androidPrompt?.message}
              </Text>
              <Text style={styles.androidPromptHint}>
                {androidPrompt?.phase === 'connected'
                  ? 'Tap Done when you are ready to close the connection.'
                  : androidPrompt?.phase === 'cancelling'
                  ? 'Please wait.'
                  : 'Hold the NFC tag near the back of your device.'}
              </Text>
              <Pressable
                disabled={androidPrompt?.phase === 'cancelling'}
                onPress={() => {
                  void cancelAndroidPrompt();
                }}
                style={({ pressed }) => [
                  styles.androidPromptCancel,
                  pressed && styles.androidPromptCancelPressed,
                  androidPrompt?.phase === 'cancelling' &&
                    styles.androidPromptCancelDisabled,
                ]}
                testID="android-nfc-scan-prompt-cancel"
              >
                <Text style={styles.androidPromptCancelText}>
                  {androidPrompt?.phase === 'connected'
                    ? 'Done'
                    : androidPrompt?.phase === 'cancelling'
                    ? 'Closing…'
                    : 'Cancel'}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
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
  splitContent: {
    flex: 1,
  },
  actionsContainer: {
    flex: 1,
    minHeight: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#bbb',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  actionsScrollContent: {
    gap: 8,
    paddingBottom: 24,
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
    minHeight: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  logScrollContent: {
    gap: 8,
    paddingBottom: 16,
  },
  logEmpty: {
    color: '#666',
  },
  logLine: {
    fontSize: 12,
    color: '#111',
  },
  androidPromptBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  androidPromptCard: {
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 18,
    backgroundColor: '#fff',
  },
  androidPromptIcon: {
    marginBottom: 8,
    color: '#0a84ff',
    fontSize: 42,
    fontWeight: '700',
  },
  androidPromptTitle: {
    marginBottom: 8,
    color: '#111',
    fontSize: 20,
    fontWeight: '700',
  },
  androidPromptMessage: {
    color: '#333',
    fontSize: 15,
    textAlign: 'center',
  },
  androidPromptHint: {
    marginTop: 8,
    color: '#666',
    fontSize: 13,
    textAlign: 'center',
  },
  androidPromptCancel: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ddd',
    paddingTop: 14,
  },
  androidPromptCancelPressed: {
    opacity: 0.55,
  },
  androidPromptCancelDisabled: {
    opacity: 0.45,
  },
  androidPromptCancelText: {
    color: '#0a84ff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default App;
