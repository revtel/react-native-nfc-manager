# Expo Development Build physical-device smoke record — 2026-09-29

The basic flows below passed on the recorded devices. Tag-scan outcomes were
reported by the user during an interactive test session; complete raw tag payloads,
NfcA response bytes, and device logs were not retained. The Android scan-prompt
display and manual cancellation were also directly observed through device
screenshots. This record does not establish the full stable-promotion gate.

## Candidate and environment

- Package: `react-native-nfc-manager` **4.0.0-beta.9**, packed from the working tree
  on `v4-refactor` at `7afa3e024e8972dc40380ea4f27e0f6390072205`, including
  pre-existing uncommitted changes. This is a local candidate, not a verification
  of the published npm artifact or the clean commit alone.
- Tarball: `react-native-nfc-manager-4.0.0-beta.9.tgz`.
- Tarball SHA-256:
  `39b0dbcaaa60e4739ca3f31b05c4797bbe630e5f79b1e6a2dd0540e64fe3c8ce`.
- Expo **57.0.21**, React Native **0.86.3**, New Architecture, `expo-dev-client`.
- Node **22.22.2**, Java **17.0.12**, rbenv Ruby **3.1.2**, Bundler **2.3.7**,
  CocoaPods **1.15.2**.
- Local native builds, device installation, and Metro over Wi-Fi. No hosted EAS
  build was performed.
- The Expo smoke UI was updated during testing to identify message-less error
  subclasses and provide an Android scan prompt. Android prompt results below
  refer to the updated UI loaded through Metro; the packed native dependency
  remained the same.

## iOS results

Device: **iPhone 15 Plus**, iOS **26.6.1 (23G83)**, paired over the local network,
Developer Mode enabled. NDEF tag model was not recorded.

| Flow | Result | Observed behavior |
| --- | --- | --- |
| Start / support / enabled | Pass | `start()` succeeded; `isSupported(Ndef)` and `isEnabled()` returned `true`. |
| NDEF request, `getTag()`, cleanup | Pass | User confirmed all instructed read and cleanup steps succeeded. |
| Cancel pending request after 2.5 seconds | Pass | Cancellation normal; no `did not settle` message. |
| Read again after cancellation | Pass | Subsequent tag read succeeded. |
| One-shot NDEF event | Pass | One `discoverTag`, one `sessionClosed`; after logging improvement, user confirmed expected `FirstNdefInvalid` closure. |
| Wait without scanning until session timeout | Pass | NDEF error and `sessionClosed` both reported `Timeout`; next tag read succeeded. |
| Background / resume and repeated read | Pass | User confirmed idle recovery and pending-session cancellation/recovery steps succeeded. |
| ISO 15693 commands / timeout / cancellation | Not tested | No suitable-tag result recorded. |

`FirstNdefInvalid` is the package's mapping of the iOS first-NDEF-read session
invalidation status. In this one-shot flow, `invalidateAfterFirstRead: true`
ends the session after the successful first read; this result was treated as
expected session completion.

## Android results

Device: **Samsung SM-N975U1**, Android **12**, **arm64-v8a**, wireless ADB,
NFC enabled. **NTAG215** was explicitly confirmed for the NfcA test and the
subsequent background/resume NDEF tests; earlier NDEF tag models were not
separately recorded.

| Flow | Result | Observed behavior |
| --- | --- | --- |
| Start / support / enabled | Pass | `start()` succeeded; `isSupported(Ndef)` and `isEnabled()` returned `true`. |
| NDEF request, `getTag()`, cleanup | Pass | User confirmed normal reading and automatic prompt closure. |
| Manual scan-prompt Cancel | Pass | Directly observed `NDEF error: UserCancel`, the disabled closing prompt, then `cancelTechnologyRequest() success` and return to ready state. |
| Cancel pending request after 2.5 seconds | Pass | User confirmed normal automatic cancellation with the updated prompt. |
| Read again after cancellation | Pass | Subsequent NDEF read succeeded. |
| One-shot tag event | Pass | User confirmed one `discoverTag`, `unregisterTagEvent(one-shot) success`, and automatic prompt closure. |
| NfcA `transceive([0x30, 0x00])` | Pass | Successful NTAG215 read; user also confirmed cleanup and prompt closure. Response bytes were not supplied. |
| Background / resume and repeated read | Pass | NTAG215 reads, pending-request cancellation, and prompt closure succeeded; no stuck busy state. |
| Prolonged no-tag wait / automatic scan timeout | Not fully tested | A pending request was manually cancelled; no automatic Android tag-wait timeout is claimed. |
| NfcA I/O timeout or tag removal during I/O | Not tested | No physical-device result recorded. |
| Android back-button cancellation | Mock coverage only | Component tests exercised the shared cancellation path; no separate device result recorded. |

The initial APK installation stalled in the phone's package installer with both
streaming and non-streaming ADB installation. After the user restarted the phone,
non-streaming installation succeeded and the app launched over Wi-Fi.

## Build and automated verification

- Packed dependency provenance, iOS/Android autolinking, prebuild, and generated
  NFC configuration checks passed.
- iOS Pods installation and signed physical-device Debug build passed.
- Android arm64 New Architecture Debug APK build passed.
- Root build, lint, and public typecheck passed; root Jest passed **76 tests**.
- Example Jest passed **12 tests**, including six Expo UI tests for asynchronous
  cleanup, shared cancellation, cancellation recovery, one-shot cleanup,
  automatic cancellation, and iOS prompt exclusion.
- Generated Expo consumer TypeScript check and `git diff --check` passed.
- Expo Doctor passed **19/21 checks**. It reported the known React Native
  Directory New Architecture metadata warning and an additional Expo patch
  mismatch: expected `~57.0.25`, installed pinned `57.0.21`.
  **The Expo Doctor gate did not pass.**

These results cover the listed devices and flows. ISO 15693, Android I/O timeout,
other device/OS/tag combinations, and hosted EAS Build remain unverified. The
cached Android tag-metadata fields were not individually asserted in this session.
