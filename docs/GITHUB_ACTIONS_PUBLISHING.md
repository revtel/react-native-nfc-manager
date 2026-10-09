# Publishing from GitHub Actions

The `Publish npm package` workflow is dispatched from the candidate's branch
(`main`, transitional `v4`, or preserved `v3`). It publishes an
already-prepared commit, rather than changing versions or committing files.
The default `publish=false` validates and packs only; it does not publish, create
tags or create GitHub releases. No npm token secret is used.

## One-time connection

1. Install the matching publishing workflow, controller, shared policy and tests on each release line. Port only this infrastructure onto `v3`; preserve its package, sources, dependencies and native history.
2. Create the GitHub environment `npm-publish`, restricted to the selected `main`,
   `v4` and `v3` deployment branches. Review existing environment restrictions after renaming. No required reviewer is needed when a maintainer
   wants an explicitly requested agent dispatch to finish without another approval.
3. In npm's package Settings → Trusted publishing, add GitHub Actions with:
   - Organization/user: `revtel`
   - Repository: `react-native-nfc-manager`
   - Workflow filename: `publish.yml`
   - Environment: `npm-publish`
   - Allow direct `npm publish`: enabled.
   - Allow `npm dist-tag`: disabled; separate tag promotion is not implemented.
4. A maintainer must sign in and complete npm's 2FA when configuring trust.
   The connection authorizes this workflow to publish; it does not publish a version.
5. Run a preview and inspect the candidate artifact and job summary. A preview
   verifies builds and packing, not OIDC exchange or actual npm publishing authority.

Official setup: <https://docs.npmjs.com/trusted-publishers/>.
The workflow pins Node 22.22.2 and npm 11.21.0 and uses GitHub-hosted runners.
Its validate job has read permissions only. Only the explicitly requested publish
job receives `id-token: write` and `contents: write`, inside `npm-publish`.
It installs no candidate dependencies and disables publish lifecycle scripts.

## Local legacy release entrypoint

On this v3 checkout, release-it is restricted to the v3 branch and npm legacy channel; its automatic GitHub release creation is disabled so it cannot replace the latest GitHub release. Use the reviewed hosted publisher for matched package/tag/GitHub release operations. The v4 release wrapper is not installed here.

## Candidate preparation

- `main` permits `4.x.y` under `latest`, or `4.x.y-beta.N` under `beta`.
- Transitional `v4` permits only `4.x.y-beta.N` under `beta`. Stable v4 requires the renamed `main` line and its candidate gates.
- Preserved `v3` permits only `3.x.y` under `legacy`; it cannot move npm `latest` or become the latest GitHub release.
- Beta versions are GitHub prereleases regardless of whether their branch is `main` or `v4`. Stable v4 on `main` becomes latest; v3 is a regular release with `make_latest=false`.
- This is the new controller contract, not a claim that branch renaming or stable publication has happened. Old main currently contains v3 and its older publisher. Pause release dispatches during cutover until legacy infrastructure is installed.
- Commit the exact version in package.json/package-lock.json and a reviewed
  version section in CHANGELOG.md. Preserve any additional platform lockfiles
  required by that candidate's policy. Do not dispatch uncommitted candidates.
- The selected SHA must be the full 40-character current branch tip. A newer
  branch commit stops publishing and requires choosing and validating a new SHA.
- Package repository metadata must be `https://github.com/revtel/react-native-nfc-manager.git`
  to match npm provenance. The workflow checks both source and packed metadata.
- For every v4 version on `main` or `v4`, the exact candidate needs a successful `ci.yml` push/manual run with
  Validate, Select native builds, Android New Architecture, iOS New Architecture,
  and Native build gate all successful, from the selected branch and exact SHA. Documentation-only skipped builds and
  fork-PR evidence do not satisfy it. Release-only consumer and hardware gates
  remain separately required by the v4 release policy; this workflow does not
  establish physical-device NFC behavior.
- v3 checks lint, public types, Jest and packed contents using its own source and dependencies. Native-change verification must be assessed for each legacy release.

## Agent dispatch

After the rename and settings checks, preview an already-committed v4 main candidate:

```sh
gh workflow run publish.yml --repo revtel/react-native-nfc-manager --ref main \
  -f branch=main -f version=4.0.0 -f commit=FULL_COMMIT_SHA -f publish=false
```

After explicit user authorization to publish the reviewed candidate, dispatch
the same fields with `publish=true`. The agent can inspect the run with
`gh run view` and `gh run watch`. GitHub Actions dispatch permission is required;
the agent does not need an npm token or interactive npm login for each release.
For a pre-cutover v4 beta, use both `--ref v4` and `-f branch=v4`. For legacy, use `--ref v3` and `-f branch=v3` with an exact prepared 3.x.y version. The dispatch revision and
candidate SHA must match so npm provenance identifies the actual source commit.

Publishing rechecks branch tip, native evidence, tarball SHA-512 and tag identity,
publishes the artifact produced by the validation job, verifies npm content and
dist-tag, then creates `vVERSION` and a GitHub release on the candidate commit.
All release runs share one concurrency group and are not cancelled mid-publish.

## Recovery

If npm succeeds but GitHub tag/release creation fails, keep the original artifact,
SHA and run logs. A rerun on the same branch tip can finish GitHub operations only
if the existing npm version's integrity exactly matches the newly verified artifact.
A conflicting npm artifact or Git tag blocks recovery. A moved dist-tag requires
inspection and a separately authorized tag operation. Never unpublish or overwrite
a conflicting release to make a rerun pass.

The preview may package an already-published version for setup verification.
A publish attempt accepts that version only if its content is identical; it will
not overwrite an npm version. Package contents can be inspected in the retained
`release-candidate` artifact (seven-day retention).
