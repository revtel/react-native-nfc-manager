---
search: false
---

# v4 stable preparation — 2026-09-29

This report records the original local preparation phase. Commits, pushes and
hosted CI repair were subsequently authorized; see
[CI verification](./CI_VERIFICATION.md) and its linked PR checks for that
follow-up. Statements below about uncommitted source or missing hosted evidence
describe the original phase, not the later PR state.

This is local preparation evidence, not a stable release announcement or final
4.0.0 tarball validation. The source is the uncommitted preparation changes on
`v4`, based on `a710c6c`; package version remains `4.0.0-beta.9`. No commit,
push, tag, GitHub default-branch change, actual release command (including a live
dry run), npm publication, or Directory metadata update was performed.

## Changes and validation

| Area | Evidence | Result |
| --- | --- | --- |
| Release policy | Isolated argument/command-runner tests; no real release-it invocation | 34 tests passed: automatic next-beta and explicit version selection, registry availability/error checks, dotenv entrypoints, dry-run forwarding, invalid overrides, wrong branch, dirty tree, failed preflight |
| Basic checks | `npm run verify` | Build, lint, typecheck, 110 root mocked tests, 12 example mocked tests, 107 packed files passed |
| Codegen | `npm run verify:codegen` | Packed RN 0.76.9, 0.77.3 and 0.84.0 consumers generated Android/iOS interfaces successfully |
| Android compiler | `./gradlew :app:assembleDebug --no-daemon --stacktrace` in example/android, Java 17 | Full RN 0.84 application build passed |
| iOS compiler | `rbenv exec bundle exec pod install`, then unsigned generic Simulator application build | Pods and full RN 0.84 application build passed on local Xcode 27.0 |
| Clean installation | Fresh temporary source copy, root npm ci/build, example npm ci | Resolved library entrypoint inside the temporary checkout's own dist; no prior node_modules or dist |
| Workflow inspection | YAML parsing, all run steps checked with bash -n, trigger/permission/job review | Passed; no hosted execution claimed |
| Documentation | Local/branch-qualified link targets and introductory JSX parsing | Passed; remote v4 links require the pending branch push |
| Lock metadata | Root package version/dependencies compared with lock metadata | Already consistent; no dependency upgrade or npm lock rewrite needed |

Local toolchain: Node 22.22.2, Java 17 (Zulu), Ruby 3.1.2, Bundler 2.3.7,
Xcode 27.0 (27A266a). The configured hosted iOS job selects Xcode 26.2 on
macOS 15; this local run does not verify that hosted environment.

`pod install` changed only the react-native-nfc-manager Pod checksum, reflecting
the canonical repository URL now used by its podspec. Other Pod versions were
unchanged. Compiler output retains upstream build-phase/deprecation warnings.
The clean npm install also reported dependency audit findings; dependency
remediation was not part of this tooling/documentation change, and passing
installation is not a security audit result.

The clean checkout was `/private/tmp/nfc-v4-preparation-clean-_8clewda`.
Local diagnostic logs (temporary, not durable release artifacts):

- `/private/tmp/nfc-v4-preparation-clean-install.log`
- `/private/tmp/nfc-v4-preparation-codegen.log`
- `/private/tmp/nfc-v4-preparation-android.log`
- `/private/tmp/nfc-v4-preparation-pods.log`
- `/private/tmp/nfc-v4-preparation-ios.log`

## Remaining promotion gates

- Obtain separately authorized commits/push and successful hosted `Validate`,
  `Android New Architecture`, and `iOS New Architecture` checks. Apply verified
  status-check/branch-protection settings separately.
- Prepare an unpublished exact final version and reviewed changelog. Record
  commit and tarball SHA-256, then validate that final candidate, including
  packed support-floor and Expo builds. This session did not rerun those native
  release-only consumers or validate a stable tarball.
- Review candidate differences against historical physical-device evidence;
  perform applicable retests and retain explicit unverified flows. No hardware
  tests were run in this preparation session and no earlier beta record was
  relabeled. ISO 15693, configured transceive timeout, and NFC-V/ISO-DEP metadata
  gaps remain visible in the existing records.
- Review actual release preview and authorize publication/default-branch
  operations independently, following [RELEASING.md](./RELEASING.md).
- Update stable public claims and React Native Directory only in coordination
  with actual npm promotion, and verify the published package and Expo Doctor.

The OpenSpec change and AGENTS.md updates are locally ignored by existing
`.git/info/exclude` rules. They remain available in this workspace but are not
included in ordinary Git changes; no ignore policy was changed during this work.

## Beta selection follow-up

The same-day refinement allows an omitted beta version to increment the local
beta counter. Stable and new beta series still require exact versions. Registry
checks reject existing candidates and fail closed on lookup/response errors.
All registry and release calls in regression tests were stubbed; no live release
preview or publication was executed. `npm run verify` passed again after this
refinement. Native/Codegen results above belong to the preceding preparation run;
those builds were not repeated for this release-helper/documentation-only edit.
