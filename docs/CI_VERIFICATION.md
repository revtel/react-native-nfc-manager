# Verifying selective native CI

Use the Actions run linked from a pull request's checks, and confirm its head
commit matches the revision under review. `Validate` and `Native build gate`
are the stable checks intended for branch protection. No branch-protection
setting is changed by this documentation.

## Full-build case

A workflow, shared dependency, shared source, or Codegen change must select both
native platforms. Require successful `Select native builds`, `Validate`,
`Android New Architecture`, `iOS New Architecture`, and `Native build gate` jobs.
A passing selection or aggregate job alone is not evidence of native compilation.

The initial v4 run on 6d3c1fc
([run 36538420535](https://github.com/revtel/react-native-nfc-manager/actions/runs/36538420535))
passed Validate but failed both native jobs during environment setup. Android
requested the removed SDK `tools` package; the Ruby lockfile excluded the CI
Ruby platform. The repair is reviewed in
[PR #845](https://github.com/revtel/react-native-nfc-manager/pull/845), with its
[first repair run](https://github.com/revtel/react-native-nfc-manager/actions/runs/36539848358).
Use the latest checks on that PR for the final result if a later correction is
needed; do not treat the existence of a run as a passing result.

The first repair run passed iOS compilation and basic validation, but exposed
an Android clean-checkout issue: the example Gradle wrapper had been ignored by
Git. Commit `0ab8cbb` includes its launchers, JAR, and Gradle 9.0.0 properties,
with explicit launcher line endings. The JAR SHA-256 matches Gradle's published
9.0.0 wrapper checksum. The subsequent full-build verification is
[run 36540409725](https://github.com/revtel/react-native-nfc-manager/actions/runs/36540409725).

## Documentation-only case

The entire PR diff must contain only documentation (not merely its latest
commit). Expect:

- Select native builds: success, with Android and iOS both false.
- Validate: success, including mocked tests and Codegen.
- Android New Architecture and iOS New Architecture: skipped.
- Native build gate: success, explicitly reporting that no native build ran.

A follow-up documentation PR can target the CI repair branch before that branch
is merged into v4. This proves skip behavior without merging unverified CI
changes or altering v3 main. Review its base branch before merging; a stacked
verification PR is not a request to merge its base automatically.

[PR #846](https://github.com/revtel/react-native-nfc-manager/pull/846), at
`686ac30`, demonstrated this behavior in
[run 36540038655](https://github.com/revtel/react-native-nfc-manager/actions/runs/36540038655):
selection, Validate, and Native build gate succeeded; both native builds were
skipped. This is skip-policy evidence, not compiler or hardware evidence.

## Candidate and failure cases

Manual CI dispatch forces both builds and is appropriate for the exact release
candidate. Its availability requires the workflow on the GitHub default branch;
see [the release guide](./RELEASING.md#native-ci-selection-and-verification).
A docs-only green gate never replaces the full compiler gates for a release.

Selection failure, a failed/cancelled selected build, or an unexpectedly skipped
selected build must fail Native build gate. Local tests exercise these outcomes
without intentionally breaking a hosted build. Logs uploaded as artifacts expire
after seven days, so retain durable release conclusions with candidate identity
and run links separately.

For the CI repair follow-up, local checks cover YAML and shell syntax, path and
gate regression tests, lockfile platform changes, and the basic verification
suite. Android/iOS local compilation is intentionally not repeated; actual
runner compatibility is checked by GitHub builds.
