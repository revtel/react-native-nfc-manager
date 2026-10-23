---
search: false
---

# 4.1.0 release validation — 2026-10-23

## Candidate and scope

Prepared on main for 4.1.0; the eventual release tag identifies the exact
candidate. Publication has not yet been verified in this preparation record.
Packed artifact identity and gate outcomes will be recorded before publication.

- New library behavior since 4.0.0: Android `getNfcAntennaInfo()` from original
  contributor [PR #858](https://github.com/revtel/react-native-nfc-manager/pull/858),
  merged as `09f8af0`, preserving Ömer Faruk Aydın's original commit `30e95fd`
  and the maintainer's coordinate-documentation fix `1c9add4`.
- No NFC session, NDEF transport, cancellation, timeout, or cleanup behavior was
  changed for this release. iOS adds only the unsupported shared-Codegen stub.
- Example additions exercise PR #843, already shipped in 4.0.0; its library
  implementation is unchanged. Test tools and physical results are separate.
- Toolchain: Node 22.22.2, Java 17.0.12, Ruby 3.1.2/Bundler 2.3.7, local Xcode
  27.0 (27A266a). Hosted CI uses its pinned Xcode 26.2 toolchain.

## Hardware risk review

- PR #858's original author reports Galaxy S25 FE / Android 16 / RN 0.84
  release-app antenna results matching a direct platform call, plus NDEF getTag,
  NfcA transceive and cancellation smoke checks. This is contributor-reported
  evidence, not a maintainer antenna-location test. Maintainer Samsung
  SM-N975U1 runs Android 12 and cannot verify the API 34+ hardware result.
- Maintainer [2026-10-23 RN 0.84 NDEF record](./ANDROID_NDEF_WRITE_READ_VALIDATION_2026-10-23.md):
  Samsung SM-N975U1 / Android 12 / writable NFC Forum Type 2 tag; two complete
  write/live-read/re-scan cycles and cleanup passed. The record names the earlier
  main checkout and local test additions; it is not relabeled as a packed 4.1.0
  hardware test. The subsequent changes are version metadata, notes and records.
- Reuse the attributed [4.0.0 Expo integration results](./V4_STABLE_RELEASE_2026-10-09.md)
  for unchanged iPhone 15 Plus/iOS 26.6.1 and Samsung SM-N975U1/Android 12 NDEF
  startup/read/cancel/re-read flows. Expo plugin, SDK, dependencies and those
  native paths are unchanged. No new Expo hardware run is claimed.
- Earlier empty-tag live-preflight/write failure remains recorded and its cause
  is unresolved. The successful harness uses cached preflight metadata; no
  library workaround is being shipped. Writing cancellation/tag removal, iOS
  ISO 15693 and other untested hardware flows remain unverified.
- Hosted EAS/App Store evidence remains deferred. All native build results are
  compiler evidence, not physical NFC evidence.

## Publication gates

Pending: root/example/package checks, RN 0.76.9/0.77.3/0.84 Codegen,
full RN 0.84 Android/iOS applications, packed RN 0.76.9 support-floor and
Expo 57.0.27/RN 0.86.3 consumers, exact main-SHA hosted native CI, a
non-publishing preview, and verified publication/clean consumer installation.
