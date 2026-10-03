'use strict';

const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {candidate, validateCi, digest, validateBundle, request, publish} = require('./trusted-publishing.cjs');
const sha = 'a'.repeat(40);
const input = {branch: 'main', version: '3.17.3', sha};
const manifest = {name: 'react-native-nfc-manager', version: input.version, repository: {url: 'https://github.com/revtel/react-native-nfc-manager.git'}};
const jobs = ['Validate', 'Select native builds', 'Android New Architecture', 'iOS New Architecture', 'Native build gate'].map(name => ({name, conclusion: 'success'}));
const run = {head_sha: sha, path: '.github/workflows/ci.yml', head_branch: 'v4', event: 'push', conclusion: 'success'};

test('v3 stable uses latest, v4 beta uses beta', () => {
  assert.equal(candidate(input, manifest).distTag, 'latest');
  const beta = {...input, branch: 'v4', version: '4.0.0-beta.10'};
  assert.equal(candidate(beta, {...manifest, version: beta.version}).distTag, 'beta');
});

test('rejects unsupported branch/version/channel and shell-like inputs', () => {
  for (const entry of [{branch: 'other'}, {branch: 'v4'}, {version: '4.0.0'}, {version: '3.17.03'}, {version: '3.17.3;echo unsafe'}, {sha: 'a'.repeat(7)}]) {
    assert.throws(() => candidate({...input, ...entry}, manifest));
  }
});

test('requires prepared package version and canonical repository', () => {
  assert.throws(() => candidate(input, {...manifest, version: '3.17.2'}));
  assert.throws(() => candidate(input, {...manifest, name: 'other'}));
  assert.throws(() => candidate(input, {...manifest, repository: {url: 'https://github.com/whitedogg13/react-native-nfc-manager.git'}}));
});

test('rejects publishConfig overrides that redirect registry/channel or disable provenance', () => {
  for (const publishConfig of [{registry: 'https://example.invalid'}, {tag: 'beta'}, {access: 'restricted'}, {provenance: false}]) {
    assert.throws(() => candidate(input, {...manifest, publishConfig}));
  }
  candidate(input, {...manifest, publishConfig: {registry: 'https://registry.npmjs.org/', tag: 'latest', access: 'public'}});
  assert.throws(() => candidate(input, {...manifest, private: true}));
});

test('v4 CI accepts full compiler success on exact candidate', () => {
  validateCi(run, jobs, sha);
  validateCi({...run, event: 'workflow_dispatch'}, jobs, sha);
});

test('v4 CI rejects docs-only skips, failed builds, absent jobs and aggregate-only success', () => {
  for (const conclusion of ['skipped', 'failure', 'cancelled', null]) {
    assert.throws(() => validateCi(run, jobs.map(job => job.name === 'iOS New Architecture' ? {...job, conclusion} : job), sha));
  }
  assert.throws(() => validateCi(run, jobs.slice(2), sha));
  assert.throws(() => validateCi(run, jobs.filter(job => job.name === 'Native build gate'), sha));
});

test('v4 CI rejects unrelated workflow, SHA, branch, failed run and PR evidence', () => {
  for (const change of [{head_sha: 'b'.repeat(40)}, {path: 'other.yml'}, {head_branch: 'fork'}, {conclusion: 'failure'}, {event: 'pull_request'}]) {
    assert.throws(() => validateCi({...run, ...change}, jobs, sha));
  }
});

test('bundle validation detects tampering and mismatched release identity', () => {
  const bytes = Buffer.from('candidate tarball');
  const metadata = {...input, distTag: 'latest', filename: 'react-native-nfc-manager-3.17.3.tgz', integrity: digest(bytes)};
  validateBundle(metadata, input, bytes);
  assert.throws(() => validateBundle(metadata, input, Buffer.from('tampered tarball')));
  for (const change of [{branch: 'v4'}, {version: '3.17.4'}, {sha: 'b'.repeat(40)}, {distTag: 'beta'}, {filename: '../package.tgz'}]) {
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

test('publishes verified artifact before creating tag/release and recovers an identical partial release', async t => {
  const originalEnv = {...process.env};
  const originalFetch = global.fetch;
  const bundle = fs.mkdtempSync(path.join(os.tmpdir(), 'nfc-publishing-test-'));
  t.after(() => {process.env = originalEnv; global.fetch = originalFetch; fs.rmSync(bundle, {recursive: true, force: true});});
  process.env.PUBLISH = 'true';
  process.env.GH_TOKEN = 'test-only';
  process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN = 'test-only';
  process.env.ACTIONS_ID_TOKEN_REQUEST_URL = 'https://example.invalid';
  const bytes = Buffer.from('candidate');
  const metadata = {...input, distTag: 'latest', filename: 'react-native-nfc-manager-3.17.3.tgz', integrity: digest(bytes)};
  fs.writeFileSync(path.join(bundle, 'metadata.json'), JSON.stringify(metadata));
  fs.writeFileSync(path.join(bundle, metadata.filename), bytes);
  fs.writeFileSync(path.join(bundle, 'release-notes.md'), 'Reviewed fixes');
  let existing = false;
  let conflict = false;
  let moved = false;
  let tagExists = false;
  let releaseExists = false;
  const calls = [];
  global.fetch = async (url, options) => {
    calls.push({url, method: options.method || 'GET'});
    let result;
    if (url.endsWith('git/ref/heads/main')) result = {object: {sha: moved ? 'b'.repeat(40) : sha}};
    else if (url.endsWith('git/ref/tags/v3.17.3')) result = tagExists ? {object: {type: 'commit', sha}} : null;
    else if (url.endsWith('/git/refs')) {tagExists = true; result = {};}
    else if (url.endsWith('releases/tags/v3.17.3')) result = releaseExists ? {draft: false, prerelease: false} : null;
    else if (url.endsWith('/releases')) {releaseExists = true; result = {};}
    else if (url.endsWith('/dist-tags')) result = {latest: input.version};
    else result = existing ? {dist: {integrity: conflict ? 'different artifact' : metadata.integrity}} : null;
    return {ok: result !== null, status: result === null ? 404 : 200, json: async () => result};
  };
  const executions = [];
  const execute = (command, args) => {executions.push({command, args}); existing = true;};
  await publish(input, bundle, execute);
  assert.equal(executions.length, 1);
  assert.equal(executions[0].command, 'npm');
  assert.deepEqual(executions[0].args.slice(0, 5), ['publish', path.join(bundle, metadata.filename), '--ignore-scripts', '--tag', 'latest']);
  assert(tagExists && releaseExists);
  const firstWrite = calls.find(call => call.method === 'POST');
  assert(firstWrite.url.endsWith('/git/refs'));
  await publish(input, bundle, execute);
  assert.equal(executions.length, 1, 'Recovery must not republish');
  conflict = true;
  await assert.rejects(publish(input, bundle, execute), /different package content/);
  assert.equal(executions.length, 1);
  conflict = false;
  moved = true;
  await assert.rejects(publish(input, bundle, execute), /Branch advanced/);
  assert.equal(executions.length, 1);
});
