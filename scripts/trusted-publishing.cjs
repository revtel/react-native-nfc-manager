'use strict';

const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const {releasePolicy} = require('./release-policy.cjs');

const repository = 'revtel/react-native-nfc-manager';
const packageName = 'react-native-nfc-manager';
const registry = 'https://registry.npmjs.org';
const requiredJobs = ['Validate', 'Select native builds', 'Android New Architecture', 'iOS New Architecture', 'Native build gate'];

function candidate(input, manifest) {
  const {distTag} = releasePolicy(input.branch, input.version);
  assert(/^[a-f0-9]{40}$/.test(input.sha), 'Provide the complete 40-character commit SHA');
  assert.equal(manifest.name, packageName, 'Unexpected package');
  assert.equal(manifest.version, input.version, 'Commit the selected package version before dispatching');
  assert.equal(manifest.repository?.url, `https://github.com/${repository}.git`, 'Package repository must match the OIDC repository');
  const publishConfig = manifest.publishConfig || {};
  if (publishConfig.registry !== undefined) assert.equal(publishConfig.registry.replace(/\/$/, ''), registry);
  if (publishConfig.tag !== undefined) assert.equal(publishConfig.tag, distTag);
  if (publishConfig.access !== undefined) assert.equal(publishConfig.access, 'public');
  assert.notEqual(publishConfig.provenance, false, 'Do not disable provenance');
  assert.notEqual(manifest.private, true, 'Private packages cannot be released here');
  return {...input, distTag};
}

function validateCi(run, jobs, sha, branch) {
  assert(['main', 'v4'].includes(branch), 'v4 CI requires the selected main/v4 branch');
  assert.equal(run.head_sha, sha, 'CI must cover the exact candidate');
  assert.equal(run.path, '.github/workflows/ci.yml');
  assert.equal(run.head_branch, branch);
  assert(['push', 'workflow_dispatch'].includes(run.event), 'Use CI on the selected candidate branch, not a fork PR');
  assert.equal(run.conclusion, 'success', 'Candidate CI failed');
  for (const name of requiredJobs) {
    assert.equal(jobs.find(job => job.name === name)?.conclusion, 'success', `${name} must actually succeed; skipped builds do not qualify`);
  }
}

function digest(bytes, algorithm = 'sha512') {
  return `${algorithm}-${createHash(algorithm).update(bytes).digest('base64')}`;
}

function validateBundle(metadata, input, tarball) {
  assert.equal(metadata.branch, input.branch);
  assert.equal(metadata.version, input.version);
  assert.equal(metadata.sha, input.sha);
  assert.equal(metadata.distTag, releasePolicy(input.branch, input.version).distTag);
  assert.equal(metadata.filename, `${packageName}-${input.version}.tgz`);
  assert.equal(metadata.integrity, digest(tarball), 'Candidate tarball integrity changed');
}

async function request(url, options = {}, allowMissing = false) {
  const response = await fetch(url, {...options, signal: AbortSignal.timeout(30000)});
  if (allowMissing && response.status === 404) return null;
  assert(response.ok, `Request failed: ${response.status} ${url}`);
  return response.json();
}

function github(endpoint, options = {}, allowMissing = false) {
  assert(process.env.GH_TOKEN, 'GitHub token is required');
  return request(`https://api.github.com/repos/${repository}/${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.GH_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
  }, allowMissing);
}

async function checkHead(input) {
  const head = await github(`git/ref/heads/${input.branch}`);
  assert.equal(head.object.sha, input.sha, 'Branch advanced; validate and select its new candidate');
}

async function checkCi(input) {
  if (!releasePolicy(input.branch, input.version).requiresNativeCi) return;
  const data = await github(`actions/runs?head_sha=${input.sha}&per_page=100`);
  const run = data.workflow_runs.find(item => item.path === '.github/workflows/ci.yml' && item.head_branch === input.branch && ['push', 'workflow_dispatch'].includes(item.event));
  assert(run, 'Run full v4 CI on the selected branch and exact candidate first');
  const dataJobs = await github(`actions/runs/${run.id}/jobs?per_page=100`);
  validateCi(run, dataJobs.jobs, input.sha, input.branch);
}

async function checkTag(input) {
  let tag = await github(`git/ref/tags/v${input.version}`, {}, true);
  if (!tag) return null;
  if (tag.object.type === 'tag') {
    tag = await github(`git/tags/${tag.object.sha}`);
  }
  assert.equal(tag.object.type, 'commit', 'Unexpected tag object');
  assert.equal(tag.object.sha, input.sha, 'Release tag belongs to another commit');
  return tag;
}

function run(command, args, cwd, encoding) {
  return execFileSync(command, args, {cwd, encoding, stdio: encoding ? ['ignore', 'pipe', 'inherit'] : 'inherit'});
}

function changelogStart(changelog, version) {
  const heading = new RegExp(`^## (?:\\[${version.replace(/\./g, '\\.')}\\](?:\\([^\\n]*\\))?|${version.replace(/\./g, '\\.')})(?:\\s|$)`, 'm');
  return changelog.search(heading);
}

async function prepare(input, root, bundle) {
  const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json')));
  const selected = candidate(input, manifest);
  assert.equal(run('git', ['rev-parse', 'HEAD'], root, 'utf8').trim(), input.sha);
  run('git', ['diff', '--exit-code', 'HEAD'], root);
  await checkHead(input);
  await checkCi(input);
  await checkTag(input);
  fs.mkdirSync(bundle, {recursive: true});
  const packed = JSON.parse(run('npm', ['pack', '--json', '--pack-destination', bundle], root, 'utf8'));
  assert.equal(packed.length, 1);
  const filename = `${packageName}-${input.version}.tgz`;
  assert.equal(packed[0].filename, filename);
  const tarball = fs.readFileSync(path.join(bundle, filename));
  const packedManifest = JSON.parse(run('tar', ['-xOzf', path.join(bundle, filename), 'package/package.json'], root, 'utf8'));
  candidate(input, packedManifest);
  run('git', ['diff', '--exit-code', 'HEAD'], root);
  const files = packed[0].files.map(file => file.path);
  for (const required of ['index.d.ts', 'app.plugin.js', 'react-native-nfc-manager.podspec']) assert(files.includes(required), `Missing ${required}`);
  assert(!files.some(file => /(^|\/)(\.env|\.npmrc|node_modules|Pods|DerivedData)(\/|$)/.test(file)), 'Unexpected sensitive/generated package files');
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  const start = changelogStart(changelog, input.version);
  if (process.env.PUBLISH === 'true') assert(start >= 0, 'Commit a reviewed changelog section for this version');
  const notes = start >= 0 ? changelog.slice(start).split(/\n## /)[0] : `Validation preview for ${packageName}@${input.version}. No publication requested.`;
  fs.writeFileSync(path.join(bundle, 'release-notes.md'), `${notes}\n\nCandidate: ${input.sha}\n`);
  const metadata = {...selected, filename, integrity: digest(tarball)};
  fs.writeFileSync(path.join(bundle, 'metadata.json'), JSON.stringify(metadata, null, 2));
  run('npm', ['publish', path.join(bundle, filename), '--dry-run', '--ignore-scripts', '--tag', selected.distTag, '--access', 'public', '--registry', registry], root);
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Candidate\n\n- Branch: ${input.branch}\n- Version: ${input.version}\n- Commit: ${input.sha}\n- npm tag: ${selected.distTag}\n- Integrity: ${metadata.integrity}\n- Requested publication: ${process.env.PUBLISH === 'true'}\n`);
}

async function verifyPublication(input, metadata, lookup = request, pause = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  // npm accepts the upload before the version and dist-tag become readable.
  for (let attempt = 0; attempt < 18; attempt++) {
    const published = await lookup(`${registry}/${packageName}/${input.version}`, {}, true);
    if (published) {
      assert.equal(published.dist.integrity, metadata.integrity, 'Published package differs from the verified candidate');
      const tags = await lookup(`${registry}/-/package/${packageName}/dist-tags`, {}, true);
      if (tags?.[metadata.distTag] === input.version) return;
    }
    if (attempt < 17) await pause(10000);
  }
  throw new Error('npm publication is still processing; inspect the registry and rerun the failed job once available');
}

async function publish(input, bundle, execute = run) {
  assert.equal(process.env.PUBLISH, 'true', 'Publication was not requested');
  assert(process.env.ACTIONS_ID_TOKEN_REQUEST_URL && process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN, 'Publication requires GitHub Actions OIDC');
  const policy = releasePolicy(input.branch, input.version);
  const metadata = JSON.parse(fs.readFileSync(path.join(bundle, 'metadata.json')));
  const tarballPath = path.join(bundle, `${packageName}-${input.version}.tgz`);
  validateBundle(metadata, input, fs.readFileSync(tarballPath));
  // Recheck before mutations; branch/CI may have changed since packaging.
  await checkHead(input);
  await checkCi(input);
  const tag = await checkTag(input);
  const versionUrl = `${registry}/${packageName}/${input.version}`;
  const existing = await request(versionUrl, {}, true);
  if (existing) {
    assert.equal(existing.dist.integrity, metadata.integrity, 'Version already exists with different package content');
    console.log('Identical npm artifact already exists; completing GitHub release only');
  } else {
    execute('npm', ['publish', tarballPath, '--ignore-scripts', '--tag', metadata.distTag, '--access', 'public', '--registry', registry], bundle);
  }
  await verifyPublication(input, metadata);
  if (!tag) await github('git/refs', {method: 'POST', body: JSON.stringify({ref: `refs/tags/v${input.version}`, sha: input.sha})});
  const release = await github(`releases/tags/v${input.version}`, {}, true);
  if (!release) {
    await github('releases', {method: 'POST', body: JSON.stringify({tag_name: `v${input.version}`, name: `v${input.version}`, body: fs.readFileSync(path.join(bundle, 'release-notes.md'), 'utf8'), draft: false, prerelease: policy.prerelease, make_latest: policy.distTag === 'latest' ? 'true' : 'false'})});
  } else {
    assert.equal(release.draft, false);
    assert.equal(release.prerelease, policy.prerelease);
  }
  console.log(`Verified ${packageName}@${input.version}, npm ${metadata.distTag}, tag and GitHub release`);
}

async function main() {
  assert.equal(process.env.GITHUB_REPOSITORY, repository);
  const input = {branch: process.env.CANDIDATE_BRANCH, version: process.env.CANDIDATE_VERSION, sha: process.env.CANDIDATE_SHA};
  candidate(input, {name: packageName, version: input.version, repository: {url: `https://github.com/${repository}.git`}});
  assert.equal(process.env.GITHUB_REF, `refs/heads/${input.branch}`, 'Dispatch from the selected candidate branch');
  assert.equal(process.env.GITHUB_SHA, input.sha, 'Workflow and candidate must use the same commit for provenance');
  const bundle = path.resolve(process.env.BUNDLE_DIR);
  if (process.argv[2] === 'prepare') await prepare(input, path.resolve(process.env.CANDIDATE_DIR), bundle);
  else if (process.argv[2] === 'publish') await publish(input, bundle);
  else throw new Error('Expected prepare or publish');
}

if (require.main === module) main().catch(error => {console.error(error.message); process.exitCode = 1;});
module.exports = {candidate, validateCi, digest, validateBundle, request, publish, changelogStart, verifyPublication};
