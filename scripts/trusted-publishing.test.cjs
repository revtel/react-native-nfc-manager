'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {candidate, validateCi, digest, validateBundle, request, publish, changelogStart, verifyPublication} = require('./trusted-publishing.cjs');
const sha = 'a'.repeat(40);
const input = {branch: 'v3', version: '3.17.3', sha};
const manifest = {name: 'react-native-nfc-manager', version: input.version, repository: {url: 'https://github.com/revtel/react-native-nfc-manager.git'}};
const jobs = ['Validate', 'Select native builds', 'Android New Architecture', 'iOS New Architecture', 'Native build gate'].map(name => ({name, conclusion: 'success'}));
const run = {head_sha: sha, path: '.github/workflows/ci.yml', head_branch: 'v4', event: 'push', conclusion: 'success'};

test('release channels follow exact branch/version policy', () => {
  for (const [branch, version, distTag] of [
    ['v3', '3.17.3', 'legacy'], ['main', '4.0.0', 'latest'],
    ['main', '4.0.0-beta.12', 'beta'], ['v4', '4.0.0-beta.12', 'beta'],
  ]) {
    assert.equal(candidate({...input, branch, version}, {...manifest, version}).distTag, distTag);
  }
});

test('rejects unsupported branch/version/channel and shell-like inputs', () => {
  for (const entry of [{branch: 'other'}, {branch: 'v4'}, {branch: 'main'}, {version: '4.0.0'}, {version: '3.17.03'}, {version: '3.17.3;echo unsafe'}, {sha: 'a'.repeat(7)}]) {
    assert.throws(() => candidate({...input, ...entry}, manifest));
  }
});

test('requires prepared package version and canonical repository', () => {
  assert.throws(() => candidate(input, {...manifest, version: '3.17.2'}));
  assert.throws(() => candidate(input, {...manifest, name: 'other'}));
  assert.throws(() => candidate(input, {...manifest, repository: {url: 'https://github.com/whitedogg13/react-native-nfc-manager.git'}}));
});

test('rejects publishConfig overrides that redirect registry/channel or disable provenance', () => {
  for (const publishConfig of [{registry: 'https://example.invalid'}, {tag: 'beta'}, {tag: 'latest'}, {access: 'restricted'}, {provenance: false}]) {
    assert.throws(() => candidate(input, {...manifest, publishConfig}));
  }
  candidate(input, {...manifest, publishConfig: {registry: 'https://registry.npmjs.org/', tag: 'legacy', access: 'public'}});
  assert.throws(() => candidate(input, {...manifest, private: true}));
});

test('v4 CI accepts full compiler success on exact candidate', () => {
  validateCi(run, jobs, sha, 'v4');
  validateCi({...run, head_branch: 'main'}, jobs, sha, 'main');
  validateCi({...run, event: 'workflow_dispatch'}, jobs, sha, 'v4');
});

test('v4 CI rejects docs-only skips, failed builds, absent jobs and aggregate-only success', () => {
  for (const conclusion of ['skipped', 'failure', 'cancelled', null]) {
    assert.throws(() => validateCi(run, jobs.map(job => job.name === 'iOS New Architecture' ? {...job, conclusion} : job), sha, 'v4'));
  }
  assert.throws(() => validateCi(run, jobs.slice(2), sha, 'v4'));
  assert.throws(() => validateCi(run, jobs.filter(job => job.name === 'Native build gate'), sha, 'v4'));
});

test('v4 CI rejects unrelated workflow, SHA, branch, failed run and PR evidence', () => {
  assert.throws(() => validateCi(run, jobs, sha, 'main'));
  assert.throws(() => validateCi({...run, head_branch: 'main'}, jobs, sha, 'v4'));
  for (const change of [{head_sha: 'b'.repeat(40)}, {path: 'other.yml'}, {head_branch: 'fork'}, {conclusion: 'failure'}, {event: 'pull_request'}]) {
    assert.throws(() => validateCi({...run, ...change}, jobs, sha, 'v4'));
  }
});

test('bundle validation detects tampering and mismatched release identity', () => {
  const bytes = Buffer.from('candidate tarball');
  const metadata = {...input, distTag: 'legacy', filename: 'react-native-nfc-manager-3.17.3.tgz', integrity: digest(bytes)};
  validateBundle(metadata, input, bytes);
  assert.throws(() => validateBundle(metadata, input, Buffer.from('tampered tarball')));
  for (const change of [{branch: 'v4'}, {version: '3.17.4'}, {sha: 'b'.repeat(40)}, {distTag: 'beta'}, {distTag: 'latest'}, {filename: '../package.tgz'}]) {
    assert.throws(() => validateBundle({...metadata, ...change}, input, bytes));
  }
});

test('registry lookup distinguishes missing version from authentication/server errors', async t => {
  const original = global.fetch;
  t.after(() => {global.fetch = original;});
  global.fetch = async () => ({ok: false, status: 404});
  assert.equal(await request('https://example.invalid', {}, true), null);
  for (const status of [401, 403, 429, 500]) {
    global.fetch = async () => ({ok: false, status});
    await assert.rejects(request('https://example.invalid', {}, true));
  }
});

test('publishing requires explicit request and OIDC before contacting a registry', async t => {
  const original = {...process.env};
  t.after(() => {process.env = original;});
  process.env.PUBLISH = 'false';
  await assert.rejects(publish(input, '/unused'), /not requested/);
  process.env.PUBLISH = 'true';
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  delete process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  await assert.rejects(publish(input, '/unused'), /requires GitHub Actions OIDC/);
});

for (const [branch, version, distTag, prerelease] of [
  ['v3', '3.17.3', 'legacy', false], ['main', '4.0.0', 'latest', false],
  ['main', '4.0.0-beta.12', 'beta', true], ['v4', '4.0.0-beta.12', 'beta', true],
]) test(`publishes ${branch}/${version} safely and recovers an identical partial release`, async t => {
  const input = {branch, version, sha};
  const originalEnv = {...process.env};
  const originalFetch = global.fetch;
  const bundle = fs.mkdtempSync(path.join(os.tmpdir(), 'nfc-publishing-test-'));
  t.after(() => {process.env = originalEnv; global.fetch = originalFetch; fs.rmSync(bundle, {recursive: true, force: true});});
  process.env.PUBLISH = 'true';
  process.env.GH_TOKEN = 'test-only';
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-only';
  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.invalid';
  const bytes = Buffer.from('candidate');
  const metadata = {...input, distTag, filename: `react-native-nfc-manager-${version}.tgz`, integrity: digest(bytes)};
  fs.writeFileSync(path.join(bundle, 'metadata.json'), JSON.stringify(metadata));
  fs.writeFileSync(path.join(bundle, metadata.filename), bytes);
  fs.writeFileSync(path.join(bundle, 'release-notes.md'), 'Reviewed fixes');
  let existing = false;
  let conflict = false;
  let moved = false;
  let tagExists = false;
  let releaseExists = false;
  let crossBranchCi = false;
  let skippedNativeCi = false;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({url, method: options.method || 'GET', body: options.body});
    let result;
    if (url.endsWith(`git/ref/heads/${branch}`)) result = {object: {sha: moved ? 'b'.repeat(40) : sha}};
    else if (url.endsWith(`git/ref/tags/v${version}`)) result = tagExists ? {object: {type: 'commit', sha}} : null;
    else if (url.endsWith('/git/refs')) {tagExists = true; result = {};}
    else if (url.endsWith(`releases/tags/v${version}`)) result = releaseExists ? {draft: false, prerelease} : null;
    else if (url.endsWith('/releases')) {releaseExists = true; result = {};}
    else if (url.includes('actions/runs?')) result = {workflow_runs: [{...run, id: 123, head_branch: crossBranchCi ? (branch === 'main' ? 'v4' : 'main') : branch}]};
    else if (url.endsWith('actions/runs/123/jobs?per_page=100')) result = {jobs: jobs.map(job => skippedNativeCi && job.name === 'Android New Architecture' ? {...job, conclusion: 'skipped'} : job)};
    else if (url.endsWith('/dist-tags')) result = {[distTag]: version};
    else result = existing ? {dist: {integrity: conflict ? 'different artifact' : metadata.integrity}} : null;
    return {ok: result !== null, status: result === null ? 404 : 200, json: async () => result};
  };
  const executions = [];
  const execute = (command, args) => {executions.push({command, args}); existing = true;};
  await publish(input, bundle, execute);
  assert.equal(executions.length, 1);
  assert.equal(executions[0].command, 'npm');
  assert.deepEqual(executions[0].args.slice(0, 5), ['publish', path.join(bundle, metadata.filename), '--ignore-scripts', '--tag', distTag]);
  assert(tagExists && releaseExists);
  const releaseWrite = JSON.parse(calls.find(call => call.url.endsWith('/releases') && call.method === 'POST').body);
  assert.equal(releaseWrite.prerelease, prerelease);
  assert.equal(releaseWrite.make_latest, distTag === 'latest' ? 'true' : 'false');
  const firstWrite = calls.find(call => call.method === 'POST');
  assert(firstWrite.url.endsWith('/git/refs'));
  await publish(input, bundle, execute);
  assert.equal(executions.length, 1, 'Recovery must not republish');
  if (branch !== 'v3') {
    const writesBefore = calls.filter(call => call.method === 'POST').length;
    crossBranchCi = true;
    await assert.rejects(publish(input, bundle, execute), /selected branch and exact candidate/);
    crossBranchCi = false;
    skippedNativeCi = true;
    await assert.rejects(publish(input, bundle, execute), /must actually succeed/);
    skippedNativeCi = false;
    assert.equal(executions.length, 1);
    assert.equal(calls.filter(call => call.method === 'POST').length, writesBefore);
  } else {
    assert(!calls.some(call => call.url.includes('actions/runs?')), 'Legacy uses its own checks, not v4 native CI');
  }
  conflict = true;
  await assert.rejects(publish(input, bundle, execute), /different package content/);
  assert.equal(executions.length, 1);
  conflict = false;
  moved = true;
  await assert.rejects(publish(input, bundle, execute), /Branch advanced/);
  assert.equal(executions.length, 1);
});


test('changelog accepts linked and plain exact version headings', () => {
  for (const heading of ['## [3.17.3](https://example.com/compare) (2026-10-03)', '## [3.17.3]', '## 3.17.3 (2026-10-03)']) {
    assert.equal(changelogStart(`${heading}\n\n### Fixed\n`, '3.17.3'), 0);
  }
  assert.equal(changelogStart('## [3.17.30](https://example.com)\n', '3.17.3'), -1);
  assert.equal(changelogStart('## Unreleased\n', '3.17.3'), -1);
});


test('publication verification waits for npm indexing and the expected dist-tag', async () => {
  const metadata = {integrity: 'sha512-expected', distTag: 'latest'};
  let reads = 0;
  let waits = 0;
  const lookup = async url => {
    if (url.endsWith('/dist-tags')) return {latest: reads < 3 ? '3.17.2' : input.version};
    reads++;
    return reads === 1 ? null : {dist: {integrity: metadata.integrity}};
  };
  await verifyPublication(input, metadata, lookup, async ms => { assert.equal(ms, 10000); waits++; });
  assert.equal(reads, 3);
  assert.equal(waits, 2);
  await assert.rejects(verifyPublication(input, metadata, async () => ({dist: {integrity: 'different'}})), /differs/);
});

test('publication verification stops after a bounded wait', async () => {
  let waits = 0;
  await assert.rejects(verifyPublication(input, {integrity: 'expected', distTag: 'latest'}, async () => null, async () => { waits++; }), /still processing/);
  assert.equal(waits, 17);
});

test('rejects stable on transitional v4 and other branch-major mismatches', () => {
  for (const [branch, version] of [['v4', '4.0.0'], ['v3', '4.0.0'], ['v3', '3.18.0-beta.0'], ['main', '3.18.0'], ['main', '5.0.0']]) {
    assert.throws(() => candidate({...input, branch, version}, {...manifest, version}), /Unsupported release/);
  }
});
