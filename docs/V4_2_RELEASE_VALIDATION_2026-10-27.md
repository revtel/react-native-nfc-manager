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
current OS or this candidate. No password/tag configuration has been recorded
for this candidate. The NTAG215 action is a test tool, not evidence that it has
been exercised on a tag. A successful read does not establish the configured
protection range; the test must not assume or change the tag's configuration.

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
| Independent public API/native compatibility review | Passed, including final authentication UI validation/in-flight lock and raw command-log removal. |
| Root build, lint, public typecheck and Jest | Passed; 11 root suites / 206 tests. Initial version-banner overlap was metadata-only; package stage used 4.2.0. Final candidate checks remain required. |
| Example Jest | Passed final UI rerun: 5 suites / 45 mocked tests. |
| Packed contents, artifact hashes and local-file exclusion | Dry-run manifest passed: 4.2.0 / 110 entries, required contents present and no local workflow included. Final retained tarball/hashes pending. |
| Packed Android/iOS Codegen for RN 0.76.9, 0.77.3 and 0.84.0 | Passed all 3 versions on both platforms. Initial sandbox cache-write denial was resolved by scoped retry; it was not a source failure. |
| RN 0.84 Android debug application | Passed full assembly; compiler evidence only. |
| RN 0.84 full unsigned iOS Simulator application | Passed full application build and final rerun including MIFARE logging removal; compiler evidence only. |
| Packed RN 0.76.9 Android and iOS support-floor applications | Pending |
| Packed Expo 57.0.31/RN 0.86.3 Doctor, configuration and Android/iOS applications | Pending |
| Affected physical-device success/failure/recovery checks | Pending |
| Password-protected-tag authentication/read sequence | Unverified; suitable tag and recorded configuration required |
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
