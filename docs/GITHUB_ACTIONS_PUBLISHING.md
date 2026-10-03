# Publishing from GitHub Actions

The `Publish npm package` workflow is dispatched from the candidate's branch
(`main` or `v4`). It publishes an
already-prepared commit, rather than changing versions or committing files.
The default `publish=false` validates and packs only; it does not publish, create
tags or create GitHub releases. No npm token secret is used.

## One-time connection

1. Add the same `.github/workflows/publish.yml` and controller scripts to `main` and `v4`.
2. Create the GitHub environment `npm-publish`, restricted to the `main`
   and `v4` deployment branches. No required reviewer is needed when a maintainer
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

## Candidate preparation

- `main` permits only `3.x.y`, published under `latest`.
- `v4` permits only `4.x.y-beta.N`, published under `beta` and marked prerelease
  on GitHub. Stable v4 promotion remains the separate reviewed cutover process.
- Commit the exact version in package.json/package-lock.json and a reviewed
  version section in CHANGELOG.md. Preserve any additional platform lockfiles
  required by that candidate's policy. Do not dispatch uncommitted candidates.
- The selected SHA must be the full 40-character current branch tip. A newer
  branch commit stops publishing and requires choosing and validating a new SHA.
- Package repository metadata must be `https://github.com/revtel/react-native-nfc-manager.git`
  to match npm provenance. The workflow checks both source and packed metadata.
- For v4, the exact candidate needs a successful `ci.yml` push/manual run with
  Validate, Select native builds, Android New Architecture, iOS New Architecture,
  and Native build gate all successful. Documentation-only skipped builds and
  fork-PR evidence do not satisfy it. Release-only consumer and hardware gates
  remain separately required by the v4 release policy; this workflow does not
  establish physical-device NFC behavior.
- v3 checks lint, public types, Jest and packed contents. The 3.17.3 native patch
  has a reviewed waiver of repeated compilation/device testing; that is not a
  blanket waiver for future native changes.

## Agent dispatch

Preview an already-committed main candidate:

```sh
gh workflow run publish.yml --repo revtel/react-native-nfc-manager --ref main \
  -f branch=main -f version=3.17.3 -f commit=FULL_COMMIT_SHA -f publish=false
```

After explicit user authorization to publish the reviewed candidate, dispatch
the same fields with `publish=true`. The agent can inspect the run with
`gh run view` and `gh run watch`. GitHub Actions dispatch permission is required;
the agent does not need an npm token or interactive npm login for each release.
For a v4 beta, use both `--ref v4` and `-f branch=v4`. The dispatch revision and
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
