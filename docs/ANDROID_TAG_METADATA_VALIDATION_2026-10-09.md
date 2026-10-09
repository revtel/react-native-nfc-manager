# Android cached tag metadata validation — 2026-10-09

## Candidate and device

- Commit: `bdb0fb4dd5a60fe55958283beb667978f34ed366` on `v4`.
- Package manifest: `4.0.0-beta.10`, with unreleased Unicode/Babel and example changes. This is a source-checkout test, not a published beta.10 or final stable tarball test.
- Device: Samsung SM-N975U1, Android 12.
- Application: React Native 0.84 New Architecture CLI example, locally built debug APK.
- Cards: NFC-V and ISO-DEP over NFC-A; manufacturer/model not recorded.

## Physical-device observations

The user scanned both cards. App logs were inspected over ADB, and the user confirmed that discovery and `getTag()` results matched after completing the instructed test.

| Technology | Discovery metadata | `getTag()` metadata | Cleanup observed |
| --- | --- | --- | --- |
| NFC-V | `dsfid: 0`, `responseFlags: 0` at 10:30:29 | Same values at 10:33:04 | Request closed at 10:33:06 |
| ISO-DEP over NFC-A | `atqa: [68, 3]`, `sak: 32`, `historicalBytes: [128]` at 10:30:48 | Same values at 10:33:23 | Request closed at 10:33:25 |

Times are Asia/Taipei on 2026-10-09. Reader-mode discovery used flags 139; technology requests used flags 136 (NFC-V) and 131 (ISO-DEP), including `FLAG_READER_SKIP_NDEF_CHECK`. These actions read cached metadata and do not send transceive commands or write tags. No errors appeared in the captured flows. The captured log contains one `getTag()` request per technology; it does not establish a repeat count.

Earlier NFC-A/NTAG215 metadata evidence is recorded in [the September validation record](./V4_RELEASE_VALIDATION_2026-09-29.md). Representative NFC-A, NFC-V and ISO-DEP over NFC-A cached metadata now have physical-device evidence. ISO-DEP over NFC-B `hiLayerResponse` remains unverified.

## Software verification

- Root build, lint, public types and 163 mocked tests passed.
- Example: 15 mocked tests passed.
- Packed-package check: 107 files, required files present and generated build artifacts absent.
- Local Android all-ABI debug build passed.
- [Hosted CI for this commit](https://github.com/revtel/react-native-nfc-manager/actions/runs/37874593146): Validate (including packed Codegen matrix), Android New Architecture, iOS New Architecture and Native build gate all passed.

Compiler and mocked-test results are separate from the physical observations above.

## Remaining scope

This record does not verify ISO-DEP/NFC-V transceive, iOS ISO 15693, configured transceive timeout, background/resume, Expo device behavior or the final stable artifact. PR #843's same-session NDEF write/read regression still needs a writable NDEF tag. No publication was performed for this candidate.
