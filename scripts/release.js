'use strict';

const {execFileSync} = require('child_process');
const {join} = require('path');
const packageJson = require('../package.json');

const repositoryRoot = join(__dirname, '..');
const releaseBranch = 'v4';
const number = '(?:0|[1-9][0-9]*)';
const stableVersion = new RegExp(`^4\\.${number}\\.${number}$`);
const betaVersion = new RegExp(`^4\\.${number}\\.${number}-beta\\.${number}$`);
const allowedFlags = new Set(['--dry-run', '--ci', '--verbose', '-V', '-VV']);

function releaseArguments(args, currentVersion = packageJson.version) {
  const [channel, ...rest] = args;
  let version = rest[0] && !rest[0].startsWith('-') ? rest.shift() : undefined;
  const flags = rest;
  if (channel === 'beta' && version === undefined) {
    if (!betaVersion.test(currentVersion)) {
      throw new Error('Starting a beta series requires an explicit version, such as 4.1.0-beta.0.');
    }
    const [base, counter] = currentVersion.split('-beta.');
    const next = Number(counter) + 1;
    if (!Number.isSafeInteger(next)) {
      throw new Error('Beta counter is outside the supported range.');
    }
    version = `${base}-beta.${next}`;
  }
  const pattern = channel === 'stable' ? stableVersion : betaVersion;
  if (!['stable', 'beta'].includes(channel) || !pattern.test(version || '')) {
    throw new Error(
      'Use npm run release:stable -- 4.x.y or npm run release:beta -- 4.x.y-beta.N (stable and new beta series require an exact version).',
    );
  }
  for (const flag of flags) {
    if (!allowedFlags.has(flag)) {
      throw new Error(`Unsupported release option: ${flag}. Allowed: ${[...allowedFlags].join(', ')}`);
    }
  }
  return [
    version,
    '--config', join(repositoryRoot, '.release-it.json'),
    `--npm.tag=${channel === 'stable' ? 'latest' : 'beta'}`,
    ...flags,
  ];
}

function runRelease(args, dependencies = {}) {
  const exec = dependencies.execFileSync || execFileSync;
  const npmCli = dependencies.npmCli || process.env.npm_execpath;
  const releaseArgs = releaseArguments(args, dependencies.currentVersion ?? packageJson.version);
  if (!npmCli) {
    throw new Error('Run this entrypoint through npm.');
  }
  const options = {cwd: repositoryRoot, stdio: 'inherit'};
  const branch = exec('git', ['branch', '--show-current'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).trim();
  if (branch !== releaseBranch) {
    throw new Error(`Releases require branch ${releaseBranch}; current branch is ${branch || '(detached HEAD)'}.`);
  }
  const status = exec('git', ['status', '--porcelain'], {
    cwd: repositoryRoot,
    encoding: 'utf8',
  }).trim();
  if (status) {
    throw new Error('Releases require a clean working tree.');
  }
  const version = releaseArgs[0];
  (dependencies.log || console.log)(`Selected release: ${packageJson.name}@${version}`);
  // Fail closed on lookup errors; do not silently select a different candidate.
  const published = JSON.parse(exec(process.execPath, [
    npmCli, 'view', packageJson.name, 'versions', '--json',
  ], {cwd: repositoryRoot, encoding: 'utf8', timeout: 30000}));
  const versions = typeof published === 'string' ? [published] : published;
  if (!Array.isArray(versions) || !versions.every(item => typeof item === 'string')) {
    throw new Error('Registry returned an invalid version list; release stopped.');
  }
  if (versions.includes(version)) {
    throw new Error(`${version} is already published. Select and validate a new candidate explicitly.`);
  }
  // No release tool (including a live dry run) starts until these checks pass.
  exec(process.execPath, [npmCli, 'run', 'verify'], options);
  exec(process.execPath, [
    join(repositoryRoot, 'node_modules', 'release-it', 'bin', 'release-it.js'),
    ...releaseArgs,
  ], options);
}

if (require.main === module) {
  try {
    runRelease(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {releaseArguments, runRelease};
