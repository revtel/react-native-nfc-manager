# Release Validation

This checklist separates package, Codegen, native compiler, simulator, and physical-device evidence. Passing a lower layer does not establish a higher one.

The [2026-09-29 beta.9 validation checkpoint](./V4_RELEASE_VALIDATION_2026-09-29.md)
records historical beta.9 package checks, Codegen matrix, RN 0.76/0.84 compiler checks,
linked Expo device evidence, and remaining stable-promotion work. Validation of
the eventual stable tarball must be recorded separately.

## Routine validation

Install root and example dependencies with `npm ci` and `npm ci --prefix example`. Run all basic checks with `npm run verify`, or the individual Node.js checks below from the repository root:

```sh
npm run build
npm run lint
npm run typecheck
npm test -- --runInBand
npm run verify:package
npm run verify:codegen
```

`verify:codegen` builds and packs the library, installs that tarball into isolated temporary consumers, and runs Android and iOS Codegen from React Native 0.76.9, 0.77.3, and 0.84.0. It does not run Gradle, CocoaPods, Xcode, simulators, emulators, or NFC hardware.

To reproduce one version, pass its exact version after the focused command:

```sh
npm run verify:codegen:version -- 0.77.3
```

Run the beta.8 EventEmitter parser regression assertion with:

```sh
npm run verify:codegen:regression
```

Update the matrix whenever the TurboModule specification, packed package layout, React Native support floor, or current development baseline changes. A matrix result is evidence only for the exact versions listed.

## Example and native release gates

Run example Jest separately and label it mocked application-interaction coverage:

```sh
cd example
npm test -- --runInBand
```

Before a release, compile the React Native 0.84 New Architecture example for Android and iOS. Run each block from the repository root, using Node.js 22, Java 17, and Ruby 3.1.2 through rbenv with Bundler 2.3.7.

Android:

```sh
(
  cd example/android &&
  ./gradlew :app:assembleDebug --no-daemon
)
```

iOS Pods and unsigned Simulator application:

```sh
(
  cd example/ios &&
  rbenv exec bundle exec pod install &&
  xcodebuild \
    -workspace NfcManagerExample.xcworkspace \
    -scheme NfcManagerExample \
    -configuration Debug \
    -sdk iphonesimulator \
    -destination 'generic/platform=iOS Simulator' \
    CODE_SIGNING_ALLOWED=NO \
    build
)
```

These builds run as separate CI jobs for relevant changes alongside the always-running Node/Codegen job. Manual candidate validation forces both platforms. Record them as compiler or simulator evidence, not hardware NFC evidence.

Before promoting v4 to stable while React Native 0.76 remains the support floor, run the packed-package native consumer gate from the repository root:

```sh
npm run verify:native:support-floor
```

For focused diagnosis, run either platform independently:

```sh
npm run verify:native:support-floor:android
npm run verify:native:support-floor:ios
```

The validator pins React Native 0.76.9, React 18.3.1, React Native Community CLI 15.0.1, Node.js 22, Java 17, Ruby 3.1.2, CocoaPods 1.15.2, ffi 1.17.0, Android compile SDK 35/NDK 26.1, and the current Xcode selected by `xcodebuild`. It builds and packs the library, installs the tarball into a generated New Architecture consumer, rejects repository dependency fallback, verifies autolinking, and requires an Android debug APK and unsigned iOS Simulator app.

RN 0.76.9 pins `fmt` 11.0.2, whose consteval detection is incompatible with Apple Clang 21 in Xcode 26. On Xcode 26 or newer, the validator reports a separate compatibility phase and disables `fmt` consteval only in the disposable consumer's downloaded Pods header. The phase fails if the expected upstream header revision is absent; it never patches the library or repository source.

Temporary consumers, caches, tarballs, Pods, DerivedData, and build outputs are removed on success or failure. Add `-- --keep-temp` to a root command only while diagnosing a failure. Release evidence must record the command, candidate version/tarball, RN and toolchain versions, completed phase, expected artifact, and outcome. A failed Android or iOS gate blocks stable promotion until corrected or until the declared support floor is explicitly raised.

## Hardware retesting by change risk

Every release review records a risk assessment against the last relevant device evidence. A new version alone does not require a complete physical-device suite. Keep package, Codegen and required native compiler gates; select hardware work by affected behavior:

| Candidate changes | Physical-device work |
| --- | --- |
| Documentation or release tooling only; runtime/integration unchanged | Reuse relevant evidence with the original candidate and reason; no device rerun required |
| NFC request/read/write/transceive or runtime logic | Test the affected technology and platform, success and relevant failure/recovery paths |
| Session, callbacks, events, cancellation, timeout or cleanup | Test affected cancellation/repeat/event-count/background/cleanup paths; include timeout when that behavior is affected |
| Expo plugin, SDK or relevant native dependencies | Validate affected configuration/builds and basic Development Build start/read/cancel/re-read on affected platforms |

For each assessment record candidate commit/version, differences from the cited evidence, selected retests and outcomes, reused records with reasons, and unverified flows. Keep Android NfcA, iOS ISO 15693 and other technology checks proportional to affected code and available hardware. A malformed-command rejection is not a configured-timeout test.

First stable promotion requires a baseline evidence review across startup/support/enabled checks, NDEF request/read/cancel, repeated requests, events, background/resume and cleanup, plus applicable technology-specific flows. Compare the final candidate to historical tests and perform focused retests where behavior changed. Broader testing is appropriate for extensive session/native changes or unexplained regressions, not mandatory for every version. Missing hardware stays unverified with an explicit maintainer assessment; do not convert old evidence into tests of a new artifact. Final packed-consumer compiler gates remain separate. Hosted EAS and App Store evidence gathering is deferred and is not an added stable blocker.

## Expo stable-promotion gate

The representative Expo consumer uses Expo SDK 57.0.27, React Native 0.86.3, and the New Architecture. It installs the packed candidate rather than the repository checkout.

Run configuration generation without native compilation:

```sh
npm run verify:expo:config
```

Run either native platform independently, or both:

```sh
npm run verify:expo:android
npm run verify:expo:ios
npm run verify:expo
```

The validator runs prebuild and Expo Doctor for every mode, verifies the generated NFC configuration, package provenance, host-owned config-plugin version, and Expo autolinking, then requires an APK and/or unsigned iOS Simulator app for selected native platforms. Temporary output is removed by default; append `-- --keep-temp` only for diagnosis.

Expo Doctor currently reports that the package is untested on the New Architecture because React Native Directory lacks v4 metadata. Record that single accepted external warning. Any additional Doctor failure, prebuild failure, duplicate config-plugin runtime, Codegen warning from `NfcManager`, or missing native artifact fails the gate.

Local prebuild and compiler success are not hosted EAS Build evidence and do not exercise NFC. Before stable promotion, review historical Expo device records and candidate differences under [the risk policy](#hardware-retesting-by-change-risk); record focused retests or attributed reuse for applicable rows:

Prepare the source-controlled smoke screen from the current checkout with `npm run prepare:expo:smoke`. The command prints the temporary consumer path and device installation commands. Follow [the Expo smoke test guide](https://github.com/revtel/react-native-nfc-manager/blob/main/example-expo/README.md), and record the tarball/version, device/OS, tag, event counts, errors, cancellation, repeated-request, timeout, and background/resume results. This is a separate gate from `verify:expo`; preparing the app alone supplies no hardware evidence.

The following is a **blank per-candidate review checklist**, not a summary of previously completed tests or a mandatory full rerun. Replace Pending with a retest result, an attributed reuse decision, or an explicit unverified assessment. Earlier records retain their original versions and coverage.

| Platform | Device / OS | Tag technology | Required flow | Status |
|---|---|---|---|---|
| Android | Record exact device and OS | NDEF | `start()`, support/enabled checks, request, tag read, cancel | Pending |
| Android | Record exact device and OS | NfcA | `transceive()`, timeout, repeated request, cleanup | Pending |
| iOS | Record exact device and OS | NDEF | `start()`, support checks, request, tag read, cancel/session close | Pending |
| iOS | Record exact device and OS | ISO 15693 when available | command, timeout, cancellation, cleanup | Pending |

Record background/resume behavior and event occurrence counts when retested, or cite the original applicable record and reason for reuse. Unavailable hardware remains explicitly unverified. A hosted EAS Development Build can be recorded as additional evidence but is not inferred from these local commands.

When v4 becomes the default stable npm line, update the package's React Native Directory entry to the appropriate New Architecture classification and confirm that Expo Doctor no longer reports the metadata warning. Do not apply a package-wide classification early if it would misrepresent legacy v3 consumers.

## Release entrypoints

The supported entrypoints all load `.env` through dotenv and require a clean
working tree. Stable v4 requires `main`; beta permits `main` or transitional `v4`. They run `npm run verify` before starting release-it.
Release-it also retains its clean-tree and upstream checks. Stable requires an exact v4 version. Beta accepts an exact version or increments
the current package.json beta counter when the version is omitted. Both accept `--dry-run`, `--ci`, `--verbose`, `-V`, or `-VV`;
configuration, channel, branch, and skip-check overrides are rejected.

The commands below are **release operations**, not routine validation. Run them
only with explicit release authorization and after reviewing the applicable
candidate gates. Preview commands still run basic checks and may query remote
services; they do not commit, tag, push, publish, or create a GitHub release.

```sh
# Preview the next beta in the current series (beta.9 becomes beta.10).
npm run release:beta -- --dry-run
# An explicit version starts a new series or keeps a prepared candidate fixed.
npm run release:beta -- 4.1.0-beta.0 --dry-run
# On the renamed main line, preview the separately prepared stable candidate.
npm run release:stable -- 4.0.0 --dry-run
```

`npm run release` is an alias of `release:stable`. Actual publication uses the
same selected version without `--dry-run`: stable publishes to `latest`, beta to
`beta`. `--ci` removes interactive prompts; it does not bypass preflight checks.
Automatic increment applies only when package.json already contains a v4
`-beta.N` version. After stable (or another prerelease channel), explicitly select
the new beta series. The selected version is printed and checked against the
configured npm registry before basic checks. An existing version, lookup failure,
or malformed response stops the operation; it never silently skips to another
version. Registry publication remains the final authority if a concurrent release
occurs after preflight.

Record the exact previewed version and use it explicitly for candidate
preparation, validation, and publication. Once package.json is bumped to that
candidate, omitting the version would select its successor. For example, after
preparing beta.10, use `npm run release:beta -- 4.0.0-beta.10`, not the automatic
form. Invoke these entrypoints instead
of calling release-it or npm publish directly, which bypasses wrapper policy.

`prepack` builds only; it is not the full release gate. Native consumer and
physical-device gates remain explicit checks outside the basic wrapper.

## Changelog ownership

`CHANGELOG.md` is maintained manually. The conventional-changelog plugin drafts
release notes but has no `infile`, so it does not edit this file. During candidate
preparation, move the applicable Unreleased entries into the selected version's
section, retain historical entries, and review the cumulative v3-to-v4 migration
story rather than only commits since the last beta. Review generated GitHub
release notes against this text before publication. Keep the main README honest
about beta availability until npm stable promotion actually occurs.

## Hosted CI and branch protection

The v4 workflow runs on pull requests and pushes to `main` (and transitional `v4`). The v3 legacy history is maintained separately on `v3`. The
stable check names to require after successful hosted verification are `Validate` and
`Native build gate`. The gate requires every selected native build to succeed,
fails on selection errors or cancelled/failed selected jobs, and succeeds when
no native build is needed. Do not use workflow-level path filters that leave
required checks pending. The jobs are:

- `Validate`: Node 22, root/example mocked tests, package and Codegen checks.
- `Android New Architecture`: Ubuntu 24.04, Java 17, SDK/build-tools 36,
  NDK 27.1.12297006, full RN 0.84 debug application assembly.
- `Native build gate`: always reports the selected builds' outcomes, including
  explicit skips for irrelevant changes.
- `iOS New Architecture`: macOS 15, explicitly selected Xcode 26.2,
  Ruby 3.1.2, Bundler 2.3.7, Pods and unsigned simulator application build.

GitHub's [runner image inventory](https://github.com/actions/runner-images/blob/main/images/macos/macos-15-arm64-Readme.md)
lists Xcode 26.2; runner contents can change, so a missing toolchain is a failed
check requiring review, not a reason to silently skip compilation. CI uses
`ruby/setup-ruby` to select Ruby directly; local commands use rbenv. Both use the
committed Gemfile.lock. npm downloads, Ruby gems and Gradle dependencies are
cached; PR Gradle caches are read-only. Native logs are uploaded even on failure and retained for seven days.
The workflow needs only read access to repository contents and no release
secrets. Fork PRs use `pull_request`, never privileged `pull_request_target`.

A Pod-only fallback is useful for local diagnosis but cannot satisfy the full
iOS CI check. Local builds and workflow syntax checks do not establish hosted
success. Apply branch protections only through a separately authorized GitHub
settings change, with verified check names from an actual run.

## Stable cutover procedure

Preparation of scripts and documentation does not authorize the following
operations. Keep each candidate and operation reviewable, and record completed
steps if the process stops midway.

1. **Publish reviewed preparation, when authorized.** Commit/push v4 without force and collect full CI evidence. Record remote v3/main and v4 tip SHAs and a recovery plan. Pause publishing while branch names and settings are being reconciled.
2. **Rename the histories, when authorized.** Rename existing `main` to `v3`, then `v4` to `main`. Explicitly verify the GitHub default branch is the new main and that each history is preserved. Do not merge v4 into old main, force-replace either tip or delete other branches. A GitHub rename alone does not promote npm `latest`.
3. **Reconcile branch infrastructure before resuming releases.** The new publishing policy permits v4 stable from main under latest, v4 beta from main or transitional v4 under beta, and v3 stable from v3 under legacy. Port only `.github/workflows/publish.yml`, `scripts/release-policy.cjs`, `scripts/trusted-publishing.cjs`, `scripts/trusted-publishing.test.cjs` and `docs/GITHUB_ACTIONS_PUBLISHING.md` onto v3; preserve its package/source/native/dependency history and its own CI. Do not copy the v4 release-it entrypoint into v3. Restrict the existing v3 release-it configuration to `v3`/`legacy` and disable automatic GitHub releases so a local legacy release cannot replace the latest GitHub release. Verify the npm-publish environment's deployment branch restrictions, npm Trusted Publisher repository/workflow/environment identity and any additional branch rules. Require `Validate` and `Native build gate` on main after a successful full run. Review existing v3 PR bases, source/edit links, README badge URLs, local upstreams and local AGENTS/OpenSpec guidance.
4. **Verify the renamed development line.** Check a fresh clone contains v4 history, version and New Architecture sources. Run full CI on main; evidence from v4 at the same SHA does not qualify for the new branch's publisher. Preview an appropriate prepared candidate with `publish=false` after the infrastructure/settings review. The preview does not prove OIDC publishing authority. v3 publication must use its installed legacy controller; never use its older main/latest publisher during the transition.
5. **Prepare and validate stable separately, when authorized.** Choose an unpublished exact version, update package/lock metadata and reviewed changelog, and commit that candidate. Record SHA, version, packed tarball and hash. Run root/package/Codegen checks, full RN 0.84 native builds, RN 0.76 support-floor and Expo packed compiler gates. Keep the final tarball for published-content comparison. Compare hardware behavior changes against attributed records and perform only required focused retests; assess missing hardware explicitly. Hosted EAS/App Store gathering remains deferred. After any candidate change, rerun affected gates.
6. **Preview and publish the exact candidate, when authorized.** Review the selected main SHA/version/channel and notes, then publish the tested artifact using an explicitly authorized operation. Verify npm integrity/dist-tags, Git tag/commit and GitHub release, and install the published artifact into a clean supported consumer. GitHub default and npm latest are independent; beta remains the v4 installation path until stable publication is verified.
7. **Update public claims after verified publication.** Update README installation/status, migration and release links, retaining the `@3` legacy path. Add a short legacy maintenance notice to v3. Coordinate React Native Directory metadata and repeat Expo Doctor review. Pages deployment is separate from both branch rename and npm publication.

The policy table is explicit: `main + 4.x.y → latest`; `main/v4 + 4.x.y-beta.N → beta`; `v3 + 3.x.y → legacy`. Stable 4.x.y on transitional v4 and v3 versions on main are rejected by the new controller. The v3 branch uses the legacy controller; its local release-it configuration is restricted to `v3` and the `legacy` npm tag, with automatic GitHub releases disabled. None of these operations is authorized merely by implementing the tooling.

## Default-line cutover acceptance checklist

The GitHub development-line rename was performed on 2026-10-09: old main at `cce637113135c343d90e3a3f8b714e50cc39f273` became `v3`; v4 at `4a19f11429156746eb6eae80cf4661b460c96e61` became the default `main`. Neither history was merged or force-replaced. The pre-rename [full CI run](https://github.com/revtel/react-native-nfc-manager/actions/runs/37897589429) passed both native builds. Existing PRs #831, #832 and #839 now target `v3`; the npm-publish environment permits `main` and `v3`. A new full main CI run and fresh-clone verification complete the infrastructure review.

At the branch rename checkpoint, npm was unchanged: `latest` was `3.17.5` and `beta` was `4.0.0-beta.11`. The subsequent [4.0.0 release record](./V4_STABLE_RELEASE_2026-10-09.md) documents verified stable publication and independent channel checks. Stable candidate preparation, publishing preview/publication, consumer verification and Pages deployment remain separate operations. For branch recovery, preserve all newer commits and explicitly review renaming the lines back and restoring the default/environment restrictions; never reset or force-push either history.

The stable release review completed the following checks:

- [x] Record the exact stable candidate and packed artifact identity; attach basic/package/Codegen, RN 0.84, RN 0.76 support-floor and Expo compiler evidence. Review hardware differences, focused retests, attributed reuse and accepted gaps separately.
- [x] Preview the unpublished candidate with `publish=false` after a full successful main CI run. Existing beta.11/3.17.5 release tags point to their original commits, so they cannot serve as new-candidate previews at the renamed branch tips. Verify OIDC publishing authority during an explicitly authorized publication.
- [x] Verify stable npm publication and `latest` independently from GitHub default-line changes. Compare the published package with the reviewed artifact; confirm an unqualified install resolves stable v4 and `@3` resolves v3.
- [x] Update the post-publication README/channel and migration guidance. The post-publication Expo Doctor passed 21/21 without the former Directory warning; no upstream metadata edit was made. Historical issue replies remain a separate authorized follow-up.

## Partial failure and recovery

Stop remaining cutover operations and record which steps succeeded. GitHub's
default can be restored independently. With explicit authorization, npm latest
can be pointed to the known prior stable version, but this does not downgrade
existing installs or remove the published v4 version. Provide explicit version
pinning and native rebuild instructions for consumers needing a downgrade, or
publish a new corrective version. Never force-push release history or unpublish
a version automatically. A changed channel pointer is not evidence that a
consumer's installed package changed.

## Native CI selection and verification

Basic validation runs for every PR and main push (also transitional v4 pushes). Native selection compares the
entire PR against its merge base, or the before/after range of a push. Deletions
and both sides of renames count. Markdown, docs/, images/, and openspec/ changes
alone do not require native builds. android/ and example/android/ select Android;
ios/, example/ios/, podspecs, and example/Gemfile or Gemfile.lock select iOS.
Shared source, Codegen, dependencies, workflow changes and unclassified files
select both. Missing history or an unreadable diff also selects both.

The whole PR diff matters: adding a docs-only commit to a PR that still contains
native changes does not skip its native builds. To verify skip behavior, use a
PR whose entire diff is documentation-only (for example a follow-up PR based on
the already-verified CI repair branch), and check that Validate passes, both
platform jobs are skipped, and Native build gate succeeds.

`workflow_dispatch` forces both native builds regardless of changed files. Once
this workflow is available on the GitHub default branch, use Actions → CI → Run
workflow and select the exact candidate branch/ref, or `gh workflow run ci.yml
--ref <candidate-ref>`. While main remains the default without this manual
trigger, use a candidate PR with relevant changes or wait for the authorized
default-branch switch. Do not count a docs-only green gate as final-candidate
native verification; release requires successful Android and iOS jobs for the
candidate, not skipped jobs. The manual trigger never publishes the package.
