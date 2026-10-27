---
search: false
---

# 4.2.0 candidate validation — 2026-10-27

## Candidate and scope

4.2.0 is a prepared candidate, **not a verified publication**. The current
published stable version remains [4.1.0](https://github.com/revtel/react-native-nfc-manager/releases/tag/v4.1.0).
The selected final commit, packed artifact hashes, PR and hosted run links will
be recorded after their checks complete.

The initial software and compiler checks below cover the feature branch based
on `5ad9871c5bbac1c89fe11078087f1286ce6858bd` plus the reviewed feature changes.
They are preparation evidence, not a substitute for the final merged-main
candidate, retained tarball, or full hosted CI.

The feature was committed as `4f75c2e202d0d1e7b7ae1dd788b83d8ba960c02a` in
[PR #859](https://github.com/revtel/react-native-nfc-manager/pull/859). The
retained 4.2.0 tarball used for packed native validation has SHA-256
`209ba4fa8245528866c5cbd52d7708dc5464960cc0a27fdbf0a1e577bf802768` and npm
integrity `sha512-8oiLcDvJ0HqG9HGDIlsdmN6+szBPjPNVD3xmUNpU1908izy6jr+fFZUhw8w+nPXQW+ei85U9WMeQQGjeN5z/Lg==`.
Its 110 entries exclude local workflow files; the packed API/native sources,
declarations, package metadata and README match the committed candidate.
Subsequent example-only Scene, Metro and test corrections, and this validation
record, are outside the packed package and leave those tarball bytes unchanged.

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
reads cannot establish that path's device behavior. Focused retests must cover
ordinary-tag default and false calls, an explicit read after metadata-only access,
and affected failure/cancellation/repeated-request/cleanup and recovery behavior.
Tag removal and background/resume observations must retain their actual outcome
and scope rather than being inferred from compiler or mocked checks.

Password-protected-tag behavior remains **unverified** until a record identifies
the chip/tag technology, protection configuration, device/OS, authentication
command sequence, candidate and outcome. An Android NfcA authentication flow
cannot be assumed to switch directly into the existing Ndef handler. Skipping
Android discovery NDEF checks also removes the platform's enumerated Ndef
technology; it is a separate integration decision.

Connected-device inventory on 2026-10-27 found Samsung SM-N975U1 / Android 12
and iPhone 15 Plus / iOS 27.0.1. Inventory alone is not NFC validation. Earlier
iPhone records identify iOS 26.6.1 and must not be relabeled as tests of the
current OS or this candidate. The available tag was identified as NTAG215, but
no protection configuration or candidate-specific NFC result has been recorded.
The NTAG215 action is a test tool, not evidence that it has
been exercised on a tag. A successful read does not establish the configured
protection range; the test must not assume or change the tag's configuration.

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
This is startup evidence only. Maintainer confirmation of the visible UI and
the first NFC flows is pending; no tag read or authentication result is claimed.

Unchanged Android NDEF transport, Expo plugin and integration paths may reuse
attributed prior records after source comparison, with each original candidate
and limitation retained. See the [4.1.0 record](./V4_1_RELEASE_VALIDATION_2026-10-23.md)
and [hardware retesting policy](./RELEASING.md#hardware-retesting-by-change-risk).
Hosted EAS and App Store validation remain deferred.

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
| Packed contents, artifact hashes and local-file exclusion | Passed: retained 4.2.0 / 110-entry tarball and hashes above; required contents present, no local workflow included, critical packed files match the committed candidate. |
| Packed Android/iOS Codegen for RN 0.76.9, 0.77.3 and 0.84.0 | Passed all 3 versions on both platforms. Initial sandbox cache-write denial was resolved by scoped retry; it was not a source failure. |
| RN 0.84 Android debug application | Passed full assembly; compiler evidence only. |
| RN 0.84 full unsigned iOS Simulator application | Passed full application builds including MIFARE logging removal and the Scene-lifecycle correction; compiler evidence only. |
| Packed RN 0.76.9 Android and iOS support-floor applications | Passed: Android debug APK and complete arm64/x86_64 unsigned iOS Simulator app. Existing Xcode 26+ fmt adjustment applied only inside the disposable consumer. |
| Packed Expo 57.0.31/RN 0.86.3 Doctor, configuration and Android/iOS applications | Passed Doctor, configuration, provenance/autolinking, Android APK, iOS Pods and full iOS Simulator application. The tarball is byte-identical to the support-floor artifact above. |
| Affected physical-device success/failure/recovery checks | Pending |
| Password-protected-tag authentication/read sequence | Unverified; suitable tag and recorded configuration required |
| Signed iPhone app startup | Corrected Release app passed two sustained cold launches with one verified app runtime and no new startup crash; visible UI confirmation and NFC flows remain pending. |
| Publishing-controller regressions | Passed. |
| Exact merged-main SHA full hosted CI, both native builds actually run | Pending |
| Non-publishing preview and tarball comparison | Pending |
| npm artifact/channel, tag, GitHub release and clean published consumer | Pending; publication has not been verified |

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
