---
search: false
---

# 4.1.0 release validation — 2026-10-23

## Candidate and scope

[4.1.0 is published](https://github.com/revtel/react-native-nfc-manager/releases/tag/v4.1.0)
on npm `latest`. The release tag points to main candidate
`404e4d6cbf706cb82b8266a8052f68ce917655e3`. GitHub reports a regular, non-draft
release and returns v4.1.0 from its latest-release endpoint. npm `beta` remains
4.0.0-beta.11. Publication and the independent consumer checks below passed.

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
  startup/read/cancel/re-read flows. Expo plugin and those library native paths
  are unchanged. The validation-only consumer now uses SDK 57.0.31 rather than
  57.0.27, retaining RN 0.86.3; its new compiler/Doctor results do not establish
  new Expo hardware integration. No new Expo hardware run is claimed.
- Earlier empty-tag live-preflight/write failure remains recorded and its cause
  is unresolved. The successful harness uses cached preflight metadata; no
  library workaround is being shipped. Writing cancellation/tag removal, iOS
  ISO 15693 and other untested hardware flows remain unverified.
- Hosted EAS/App Store evidence remains deferred. All native build results are
  compiler evidence, not physical NFC evidence.

## Publication gates

The first Expo validator attempt stopped before dependency installation because
the unversioned blank TypeScript template had advanced to SDK 58. The validator
now pins `blank-typescript@57.0.33` (React 19.2.3/RN 0.86.3). The second attempt
then reached Doctor and failed its patch-version check: SDK 57 now requires
`~57.0.31`, whereas the old validator pinned 57.0.27. The consumer pin and current
validation policy were updated to 57.0.31, retaining the same RN version and
strict dependency checks. These changes affect validation tooling only; the
shipped library and tarball bytes are unchanged. Neither failed attempt is
counted as a pass; historical 57.0.27 hardware evidence retains its identity.

The SDK 57.0.31 consumer completed Doctor, configuration, provenance/autolinking,
Android assembly and Pods, but its initial iOS build process ended with no exit
status after approximately 1 MiB of Xcode warnings. The validator's synchronous
capture used Node's default output limit. It now allows 64 MiB and reports
process-level errors, retaining the NFC protocol-warning checks. A focused iOS
retry uses the same preserved packed consumer, Pods and DerivedData; the initial
interrupted build is not counted as a success. Regression coverage checks NFC
warnings after more than 1 MiB of output and process-error diagnostics.

| Check | Result |
| --- | --- |
| Root build/lint/public typecheck/Jest | Passed; 199 root tests. One local lint attempt overlapped another packer's `dist` cleanup; the sequential rerun passed. |
| Example Jest and packed contents | Passed; 20 mocked tests, 110 package files; no generated native artifacts. |
| Publishing-controller regressions | Passed; 18 tests. |
| Packed Android/iOS Codegen | Passed for RN 0.76.9, 0.77.3 and 0.84.0. |
| RN 0.84 Android/iOS example applications | Local full debug APK and complete arm64/x86_64 unsigned Simulator app passed. |
| Packed RN 0.76.9 support-floor applications | Android and complete arm64/x86_64 iOS Simulator app passed. The existing Xcode 26+ `fmt` adjustment was applied only inside the disposable consumer. |
| Packed Expo 57.0.31/RN 0.86.3 | Doctor, generated configuration, package provenance/autolinking, Android APK and Pods passed; focused full iOS retry passed with arm64/x86_64 app and NFC protocol-warning checks. |
| Documentation build | Passed during candidate preparation and after local-gate record updates. |

The immutable 4.1.0 tarball used by both packed native consumers and retained
locally has SHA-256 `2393d599c6f27b6c587b5eca9a51996350876ff41511e30798ecdf32299de6f2`
and npm integrity `sha512-2S9WNgkFHM5PllqH2aTSPZlfUqua/XbMANgeIlAps0cBxr1I07K9/L54KAFuRXyByKAWsNXi/0HYPaY8wbA1DA==`.
The initial hosted [CI](https://github.com/revtel/react-native-nfc-manager/actions/runs/39888129489)
and non-publishing [preview](https://github.com/revtel/react-native-nfc-manager/actions/runs/39888557887)
passed at `738f394`; the preview artifact is byte-identical. The subsequent
validation-tool output-limit fix and these records are excluded from the npm
package. Final-SHA checks were run separately after that fix; the earlier runs
were not substituted for final candidate checks.

## Final hosted checks and publication

All runs below cover `404e4d6cbf706cb82b8266a8052f68ce917655e3` on main.

| Check | Evidence |
| --- | --- |
| Exact candidate CI | [Run 39889559642](https://github.com/revtel/react-native-nfc-manager/actions/runs/39889559642): Validate, Select native builds, Android New Architecture, iOS New Architecture and Native build gate all succeeded; neither native build was skipped. |
| Non-publishing preview | [Run 39889997914](https://github.com/revtel/react-native-nfc-manager/actions/runs/39889997914): validate succeeded, publish skipped; downloaded artifact is byte-identical to the local and consumer tarballs. |
| OIDC npm and GitHub publication | [Run 39890318655](https://github.com/revtel/react-native-nfc-manager/actions/runs/39890318655): validate and publish both succeeded. |
| npm artifact and channel | Independently queried 4.1.0 and `latest`; registry integrity matches the value above. Downloaded npm tarball is byte-identical to the tested artifact (same SHA-256). |
| Git tag and authorship | `v4.1.0` resolves to the exact candidate and includes contributor commit `30e95fd`; original PR #858 merge history is preserved. |
| Clean registry consumer | Fresh React 19.2.3 / RN 0.84.0 consumer installed `react-native-nfc-manager@latest` as 4.1.0. Importing `NfcAntennaInfo` and checking `getNfcAntennaInfo(): Promise<NfcAntennaInfo \| null>` passed with TypeScript 5.9.3. |

The first downstream type check used the repository's older TypeScript compiler
and failed parsing newly resolved transitive `@types/node` syntax. Rechecking
the same clean consumer with the RN example's TypeScript 5.9.3 passed; no library
source or published package was changed. This consumer check is installation
and public-type evidence, not another native or hardware run.

Post-publication README/status updates do not modify the immutable npm artifact
or release tag. Local logs and candidate tarballs are retained under temporary
release-check directories; hosted release-candidate artifacts have seven-day
retention. The original NDEF failed attempt and remaining hardware limits above
remain part of the release assessment.
