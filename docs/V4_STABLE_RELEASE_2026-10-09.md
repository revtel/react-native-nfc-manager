# v4 stable release — 2026-10-09

[4.0.0 is published](https://github.com/revtel/react-native-nfc-manager/releases/tag/v4.0.0) on npm `latest`. The release tag points to main candidate `9bfb5fd0a381a049f5f74439c08178d9ba62583d`. GitHub reports a regular release and selects it as latest. `beta` remains 4.0.0-beta.11; an explicit `@3` install resolves 3.17.5.

## Published artifact

- SHA-256: `3b69ccf480b1517129d4dd8e2a56eecdb3f14dbdebd259ba85bdee908d938597`.
- Registry integrity: `sha512-l1vcxDQ/qeVbY432mLwJfPRtZfRQeHe8Al7sXumFX6DQWynm97WGY2c6queMpwSYXx4xP5Eqe5DBR7ErLL8QQg==`.
- Downloaded npm tarball is byte-identical to the retained local candidate and hosted preview artifact. Both native consumers and physical smoke apps installed this library tarball.
- Fresh npm consumer with React 19.2.3 / RN 0.86.3 resolves library 4.0.0 from latest. A separate clean `@3` installation resolves 3.17.5. These installation checks do not add native or hardware claims.

## Gates

| Check | Evidence |
| --- | --- |
| Root/example, types, package and Codegen | [Candidate review](./V4_CANDIDATE_VALIDATION_2026-10-09.md); 196 root / 15 example mocked tests and 18 publishing policy tests |
| RN 0.84 full Android/iOS application compilation | [Exact candidate CI](https://github.com/revtel/react-native-nfc-manager/actions/runs/37917827415), all five jobs successful |
| Packed RN 0.76.9 and Expo 57.0.27/RN 0.86.3 compiler consumers | Candidate review; Android and complete arm64 Simulator apps passed; x86_64 not verified locally |
| Post-publication Expo Doctor | Same Expo 57.0.27 consumer: 21/21 checks passed; previous Directory warning no longer observed |
| Non-publishing preview | [Preview run](https://github.com/revtel/react-native-nfc-manager/actions/runs/37918526963), validate passed and publish skipped |
| OIDC publication and GitHub release | [Publication run](https://github.com/revtel/react-native-nfc-manager/actions/runs/37929344557), both jobs successful |

## Focused physical integration

The human performed tag scans using the Expo 57.0.27 Development Build smoke UI. The Android installed APK was pulled and byte-compared with the built APK. The iOS signed full device app compiled, installed and launched; signed NDEF/TAG entitlements and NFC usage/identifier settings were checked. Both apps loaded the same unchanged smoke source via Metro.

| Platform/device/OS/tag | Observed flows |
| --- | --- |
| Android, Samsung SM-N975U1, Android 12, user-identified NTAG215 | Agent inspected device UI logs: startup/support/enabled, first NDEF request/getTag/read/cleanup, pending cancellation with UserCancel, then successful repeated read and cleanup |
| iOS, iPhone 15 Plus, iOS 26.6.1, same NTAG215 | User confirmed on-device UI results: startup/support/enabled, NDEF request/getTag/read/cleanup, pending cancellation and sheet closure, then successful repeated read/cleanup/sheet closure. Exact cancellation error text and payload bytes were not captured |

Android APK SHA-256: `22afc686bded09c76cc0a99519eca358f373a58eb4b525db8411bb0901812891`. iOS app tree SHA-256: `8c585725272dc9df4a34a98aade4958310e35ea9e2f7354300e36e3c3ecc3855` (sorted relative paths plus NUL-delimited contents). Raw Android UI snapshots and iOS user-response attribution are retained in the local OpenSpec candidate records; they are not new NFC behavior claims.

This is a focused integration check, not a complete device suite. Broader attributed evidence and gaps remain in the candidate review. No new writes, technology-specific transceive, ISO 15693, backgrounding, configured timeout, tag-removal or event-count verification is claimed. Hosted EAS/App Store remain deferred.

## Follow-up

Repository installation guidance now selects stable v4; package 4.0.0 bytes remain immutable. The post-publication Expo Doctor run passed 21/21 checks without the former Directory warning. No upstream metadata PR was needed to clear that warning; no Directory edit was made. Publishing the documentation website and posting historical issue replies remain separate operations; this release did not deploy GitHub Pages or post issue comments.
