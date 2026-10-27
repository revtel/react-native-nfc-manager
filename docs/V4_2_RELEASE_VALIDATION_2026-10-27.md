---
search: false
---

# 4.2.0 candidate validation — 2026-10-27

## Candidate and scope

4.2.0 is a prepared candidate, **not a verified publication**. The current
published stable version remains [4.1.0](https://github.com/revtel/react-native-nfc-manager/releases/tag/v4.1.0).
The exact merged-main commit and final hosted preview/publication links remain
pending.

The initial software and compiler checks below cover the feature branch based
on `5ad9871c5bbac1c89fe11078087f1286ce6858bd` plus the reviewed feature changes.
They are preparation evidence, not a substitute for the final merged-main
candidate, retained tarball, or full hosted CI.

The feature was committed as `4f75c2e202d0d1e7b7ae1dd788b83d8ba960c02a` in
[PR #859](https://github.com/revtel/react-native-nfc-manager/pull/859). The
earlier 4.2.0 tarball used for packed native validation has SHA-256
`209ba4fa8245528866c5cbd52d7708dc5464960cc0a27fdbf0a1e577bf802768` and npm
integrity `sha512-8oiLcDvJ0HqG9HGDIlsdmN6+szBPjPNVD3xmUNpU1908izy6jr+fFZUhw8w+nPXQW+ei85U9WMeQQGjeN5z/Lg==`.
The RN 0.76.9 and Expo native compiler gates below used that earlier artifact.
The later example-only Scene, Metro and test corrections are outside the package.

The final candidate tarball has SHA-256
`55ebd37c9551a174012d366d2256849b50371b375b16c1f38595e42ddeefda14` and npm
integrity `sha512-3LCVChwRxtGG89vMTSWgrGhxIYfM9WCkJ8qO5dGTy/E8X7US5XjSN3Xg2JbN6k2iPZKWVue3qImqhGpuJsqKFw==`.
Its README describes npm's stable v4 channel without hardcoding the current
version, so an installed 4.2.0 package will not incorrectly identify 4.1.0 as
current and an unpublished candidate does not claim prior publication.

Independent entry-by-entry comparison found identical 110 paths, file types,
modes and link metadata, with no additions or removals. **Only README.md content
differs**; the other 109 files, including compiled JavaScript, source,
declarations, Codegen specification, native implementations, package metadata
and dependency declarations, are byte-identical. All new entries match the
checkout, and local workflow files are excluded. Before repacking with
`npm pack --ignore-scripts`, both source and compiled output were confirmed to
match the previously built and validated artifact.

The native consumer and device evidence is therefore reused for the unchanged
runtime, with the original artifact identities retained. The new tarball is
**not** claimed to have run those packed native gates itself. Final PR CI will
rerun root, package, Codegen and selected native checks on the README candidate;
the exact merged-main gate and preview must select and verify its new artifact.

- Add `getTag({readNdef: false})` and the public `GetTagOptions` type. On iOS,
  the false path returns the connected tag's basic metadata before NDEF handle
  lookup or reading. No options, `{}`, and `readNdef: true` preserve the existing
  implicit read and result behavior.
- Android accepts the option and retains its existing discovery-time cached
  result. It does not perform a new NDEF read for either option value.
- The option controls this call's library behavior. System discovery checks,
  Android reader flags, tag-specific authentication, technology switching,
  session/cancellation/error semantics and support versions are unchanged.
- The example demonstrates repeated metadata-only access and cleanup, retaining
  the separate ordinary NDEF read flow. It does not implement a generic password
  flow.
- A separate NTAG215 smoke action accepts a known password through a secure input,
  performs two metadata-only calls, makes one `PWD_AUTH` attempt, and reads pages
  4–7. It clears the password input and awaits cancellation in `finally`, without
  writing the tag. Authentication and read responses are validated for length;
  passwords, PACK and data are not logged.
- Remove raw iOS MIFARE command logging, which could otherwise expose passwords
  in authentication commands. This does not change the commands, returned bytes
  or errors.
- Adopt a single UIKit scene in the iOS example and start its existing React
  Native factory after the scene's window is connected. Pin Metro resolution of
  React and React Native, including subpaths imported by the linked library, to
  the app's dependencies so root development dependencies cannot supply a second
  runtime. These example-only corrections do not change library behavior.

## Hardware risk assessment

The new iOS early-return path changes NFC runtime behavior, so historical NDEF
reads cannot establish that path's device behavior. Focused device checks cover
the ordinary default read, protected-tag metadata-only calls, cancellation,
repeated requests, cleanup and recovery after leaving and returning to the app.
Authentication and protected-content readback are assessed separately below.
No raw NFC command trace, configured timeout or exact event-count result is
inferred from UI observations, compiler builds or mocked checks.

Authentication and protected-content readback remain **unverified**. The
metadata-only observations below cover the maintainer-identified protected
NTAG215; its protection configuration and protected page range are unknown.
An Android NfcA authentication flow cannot be assumed to switch directly into
the existing Ndef handler. Skipping Android discovery NDEF checks also removes
the platform's enumerated Ndef technology; it is a separate integration decision.

Connected-device inventory on 2026-10-27 found Samsung SM-N975U1 / Android 12
and iPhone 15 Plus / iOS 27.0.1. Inventory alone is not NFC validation. Earlier
iPhone records identify iOS 26.6.1 and must not be relabeled as tests of the
current OS or this candidate. The maintainer reported the first focused iPhone
results on 2026-10-27, using a signed app whose runtime source matches
`e1df81e594a6ac9c33b1346e48c68187f1b63fd0`: native executable SHA-256
`73a11eaaed6d56b0ff4e1dbc01af4f440432be254a6c098c0c7e323a729b56c6` and Hermes
bundle SHA-256 `fa40cf7593d008609a8af0814e18acad76065ba3582668e37dd1520009c645a7`.

| Platform / device / OS | Tag | Flow | Attributed observation |
| --- | --- | --- | --- |
| iOS / iPhone 15 Plus / iOS 27.0.1 | Ordinary NDEF tag; chip model not recorded | Existing default `getTag()` read, then Cancel | Maintainer-reported pass: `ndefMessage` present and cancellation completed. |
| iOS / iPhone 15 Plus / iOS 27.0.1 | Maintainer-identified password-protected NTAG215 | Two `getTag({readNdef: false})` calls, then automatic cleanup | Maintainer-reported pass: both calls returned an identifier without `ndefMessage`; automatic cleanup completed. |
| iOS / iPhone 15 Plus / iOS 27.0.1 | Same NTAG215; protection range unknown | Known-password authentication and page 4 read, two cycles | Unverified; authentication testing is currently unavailable. |
| iOS / iPhone 15 Plus / iOS 27.0.1 | NTAG215; retry scan | Cancel a pending `NFC-A Tag Info Without NDEF Read` scan, then start that exact action and scan again | Maintainer explicitly confirmed pass: the subsequent scan succeeded. |
| iOS / iPhone 15 Plus / iOS 27.0.1 | NTAG215; retry scan | Pending `NFC-A Tag Info Without NDEF Read` scan → Home → return to app → cleanup → start that exact action and scan again | Maintainer explicitly confirmed pass: the subsequent scan succeeded. |

These are user-reported device observations, not captured NFC command traces.
The NTAG215 authentication action remains a prepared test tool. A missing error
alone does not establish authentication, protected-data readback, or absence of
an implicit read: the legacy iOS `getTag()` path suppresses NDEF read errors.
The maintainer's separate no-error observation referred to the default
`Request Ndef + Get Tag` action on the protected tag; no payload or authentication
success is inferred from it. Even a successful page 4 read would not establish
the configured protection range. No test changes tag passwords, protection
settings or memory.

The maintainer observed the two expected metadata log entries: the dedicated
smoke action intentionally calls `getTag({readNdef: false})` twice. This is not
an event-count measurement. The default `Request Ndef + Get Tag` action retains
its connection until manual Cancel; the metadata-only action awaits its own
cleanup. These are the existing, distinct example lifecycle behaviors.

The first signed iPhone candidate installed and briefly appeared in the process
list, but the maintainer reported an immediate startup crash. The crash report
matched the installed binary and showed UIKit's Scene-lifecycle enforcement
about 85 ms after launch, before JavaScript or NFC. The example linked against
the iOS 27 SDK without adopting a Scene lifecycle. Adding the single scene above
corrected that launch path.

Separately, inspection of the actual bundle found two runtime copies: the app's
React 19.2.3 / RN 0.84.0 and root development React 19.2.8 / RN 0.84.1. The same
resolution risk existed at the base commit; it did not cause the preceding
UIKit trap. The Metro correction confines both app and linked-library imports
to the app's runtime. The final signed Release bundle was inspected through its
AST and contains one React 19.2.3 and one RN 0.84.0. Its Hermes bundle SHA-256 is
`fa40cf7593d008609a8af0814e18acad76065ba3582668e37dd1520009c645a7`.

The corrected signed Release app passed two cold launches on iPhone 15 Plus /
iOS 27.0.1: its process remained present after 43 and 49 seconds, JavaScript and
NFC initialization appeared in the console, and no new startup crash was found.
The maintainer subsequently confirmed that the visible main screen is normal
and reported the first NFC observations listed above. Authentication and
protected-content readback are not claimed.

### Accepted limits for this release

The release assessment accepts the unavailable password-
authentication test for this bounded change. The new contract controls only
NDEF I/O performed by a `getTag()` call; it changes no authentication command,
transport or password-unlock behavior. The actual iPhone metadata-only and
recovery observations above, together with the independently checked Swift
zero-NDEF-call path, support that contract. Authentication/PACK validation,
protected page readback and protection-range verification remain untested;
this release makes no password-unlock claim.

Android's existing tag conversion, discovery cache and transport body are
unchanged; only the shared boolean method signature was added. The new
signature/default forwarding and retained cached result have JS/type/Codegen
and Android compiler coverage. There is **no fresh 4.2.0 Android device test** of
`readNdef: false`, cached NDEF or password authentication. For unchanged Android
behavior, reuse these attributed observations with their original identities:

- [4.0.0 Expo 57.0.27 integration record](./V4_STABLE_RELEASE_2026-10-09.md):
  Samsung SM-N975U1 / Android 12 / user-identified NTAG215; agent-inspected
  startup/support/enabled, NDEF request/getTag/read/cleanup, pending cancellation
  with UserCancel and repeated read/cleanup. This is the original 4.0.0
  Development Build evidence, not a test of the 4.2.0 package or new boolean.
- [2026-10-23 Android NDEF record](./ANDROID_NDEF_WRITE_READ_VALIDATION_2026-10-23.md):
  main `09f8af005ba692dd4179b2828fc71246d80bf3b4`, package 4.0.0 plus example
  test additions; Samsung SM-N975U1 / Android 12 / writable NFC Forum Type 2,
  exact chip unknown. Matching live readbacks, removal/re-scan persistence,
  repeated requests and cleanup passed. The earlier empty-tag preflight failure
  and other limits remain in that original record.

The Expo plugin and library integration are unchanged. The packed Expo 57.0.31
compiler/Doctor gate is new compiler evidence, while applicable historical
physical Expo evidence retains its original SDK, candidate and limitations.
No fresh Expo hardware, configured-timeout, exact event-count, iOS ISO 15693,
tag-removal-during-I/O or password-authentication result is asserted. Broader
backgrounding during I/O is not established by the pending-scan recovery test.
Hosted EAS and App Store validation remain deferred. See the
[4.1.0 record](./V4_1_RELEASE_VALIDATION_2026-10-23.md) and
[hardware retesting policy](./RELEASING.md#hardware-retesting-by-change-risk).

## Validation gates

Results identify their evidence level. Pending means no completed
candidate-specific result is asserted here. The final example UI enforces exactly
eight hexadecimal password characters and holds an in-flight lock through
awaited cleanup, preventing overlapping authentication attempts.

| Check | Status |
| --- | --- |
| Independent public API/native compatibility review | Passed, including authentication UI validation/in-flight lock, raw command-log removal and the example Scene/Metro corrections. |
| Root build, lint, public typecheck and Jest | Passed; 11 root suites / 206 tests. Initial version-banner overlap was metadata-only; package stage used 4.2.0. Final candidate checks remain required. |
| Example Jest | Passed final Scene/Metro rerun: 6 suites / 56 mocked tests. |
| Packed contents, artifact hashes and local-file exclusion | Final 55ebd37c… candidate inspected: 110 entries match the checkout; only README differs from the earlier 209ba4fa… native-gate artifact. Independent comparison passed; final CI package check pending. |
| Packed Android/iOS Codegen for RN 0.76.9, 0.77.3 and 0.84.0 | All 3 versions passed on both platforms during preparation; final README-candidate CI rerun pending. Initial sandbox cache-write denial was resolved by scoped retry; it was not a source failure. |
| RN 0.84 Android debug application | Passed full assembly; compiler evidence only. |
| RN 0.84 full unsigned iOS Simulator application | Passed full application builds including MIFARE logging removal and the Scene-lifecycle correction; compiler evidence only. |
| Packed RN 0.76.9 Android and iOS support-floor applications | Earlier 209ba4fa… artifact passed Android debug APK and complete arm64/x86_64 unsigned iOS Simulator app; reused for the new README-only candidate's byte-identical runtime. Existing Xcode 26+ fmt adjustment applied only inside the disposable consumer. |
| Packed Expo 57.0.31/RN 0.86.3 Doctor, configuration and Android/iOS applications | Earlier 209ba4fa… artifact passed Doctor, configuration, provenance/autolinking, Android APK, iOS Pods and full iOS Simulator application; reused for the new README-only candidate's byte-identical runtime. This was the same earlier tarball used by the support-floor gate. |
| Affected physical-device success/failure/recovery checks | Maintainer-reported iPhone passes: ordinary NDEF/default read plus Cancel; protected NTAG215 metadata-only repeated access and cleanup; exact metadata-only action re-scan after cancellation, and after pending scan → Home → return → cleanup. Scope and limits above. |
| Password-protected-tag authentication/read sequence | Unverified; authentication testing currently unavailable and protection range unknown. No generic password-unlock claim. |
| Signed iPhone app startup | Corrected Release app passed two sustained cold launches with one verified app runtime and no new startup crash; maintainer confirmed the visible UI is normal. |
| Publishing-controller regressions | Passed. |
| Exact merged-main SHA full hosted CI, both native builds actually run | Pending |
| Non-publishing preview and tarball comparison | Pending |
| npm artifact/channel, tag, GitHub release and clean published consumer | Pending; publication has not been verified |

The feature-head [CI run](https://github.com/revtel/react-native-nfc-manager/actions/runs/40492092423)
and [documentation run](https://github.com/revtel/react-native-nfc-manager/actions/runs/40492092441)
both completed successfully for `e1df81e594a6ac9c33b1346e48c68187f1b63fd0`.
Validate, Select native builds, Android New Architecture, iOS New Architecture
and Native build gate all actually succeeded. This is PR-head evidence; the
separate exact merged-main publishing gate remains pending.

Read-only release preflight on 2026-10-27 still found PR #859 open and draft,
main at `5ad9871c5bbac1c89fe11078087f1286ce6858bd`, npm `latest` at 4.1.0 and
`beta` at 4.0.0-beta.11, with no published 4.2.0 version or v4.2.0 Git tag.
Version availability must be checked again before publication.

The final publication must select the exact merged main tip and use the existing
OIDC publishing workflow after its full CI succeeds. PR CI cannot substitute for
the publisher's main-SHA gate. Preserve the tested tarball and compare its bytes
with the preview and published package. A moved candidate requires renewed
selection and relevant verification.

## Automated control-flow evidence

Independent review and an executable Swift harness used the actual
`getTag(from:readNdef:callback:)` helper with stub Core NFC adapters. Ten cases
covered absent session/tag for both flags, repeated false calls with zero NDEF
handle lookups or reads, and true read success, read error and unavailable NDEF
handle. Each call completed its callback once. This verifies the helper's
control flow under stubs; it does not exercise Core NFC ABI, radio behavior,
password authentication or a physical tag.

The new native boolean agrees across the TypeScript/Codegen, Android,
Objective-C++ and Swift interfaces. Tests cover default normalization, false
forwarding, returned cached data and native error mapping. Existing lifecycle
code remains unchanged, but the selected physical failure/recovery observations
remain separate release evidence.

A separate, optional whole-example `tsc --noEmit` check is not passing: a
compiler-host comparison with the same compiler and installed dependencies
reported 39 diagnostics on both the base and corrected candidate, with zero
additional diagnostics. Eight newly added test waits were annotated
`Promise<void>` to remove their additional diagnostics; runtime/library code is
unchanged. The required root public typecheck passes. This comparison does not
turn the example's pre-existing TypeScript errors into a passed check.
