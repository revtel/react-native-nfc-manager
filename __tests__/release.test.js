'use strict';

const {releaseArguments, runRelease} = require('../scripts/release');
const packageJson = require('../package.json');
const config = require('../.release-it.json');

function fixture({branch = 'v4', status = '', failVerification = false, published = ['4.0.0-beta.9'], registryError = false, currentVersion = '4.0.0-beta.9'} = {}) {
  const exec = jest.fn((command, args) => {
    if (command === 'git') {
      return args[0] === 'branch' ? branch : status;
    }
    if (args[1] === 'view') {
      if (registryError) throw new Error('registry unavailable');
      return JSON.stringify(published);
    }
    if (args.includes('verify') && failVerification) {
      throw new Error('verification failed');
    }
    return '';
  });
  return {execFileSync: exec, npmCli: '/stub/npm-cli.js', currentVersion, log: jest.fn()};
}

it('uses the same dotenv wrapper for every release entrypoint', () => {
  expect(packageJson.scripts.release).toBe(packageJson.scripts['release:stable']);
  expect(packageJson.scripts['release:stable']).toBe('dotenv -- node scripts/release.js stable');
  expect(packageJson.scripts['release:beta']).toBe('dotenv -- node scripts/release.js beta');
  expect(config.git).toMatchObject({requireBranch: 'v4', requireCleanWorkingDir: true, requireUpstream: true});
});

it.each([
  ['stable', '4.0.0', 'latest'],
  ['beta', '4.0.0-beta.10', 'beta'],
  ['beta', '4.1.0-beta.0', 'beta'],
])('forwards exact %s version and options after verification', (channel, version, tag) => {
  const deps = fixture();
  runRelease([channel, version, '--dry-run', '--ci'], deps);
  const calls = deps.execFileSync.mock.calls;
  expect(calls[2][1]).toEqual(['/stub/npm-cli.js', 'view', packageJson.name, 'versions', '--json']);
  expect(calls[3][1]).toEqual(['/stub/npm-cli.js', 'run', 'verify']);
  const forwarded = calls[4][1];
  expect(forwarded[0]).toMatch(/release-it\/bin\/release-it\.js$/);
  expect(forwarded).toContain(version);
  expect(forwarded).toContain(`--npm.tag=${tag}`);
  expect(forwarded.slice(-2)).toEqual(['--dry-run', '--ci']);
  expect(forwarded).not.toContain('--');
});

it.each([
  [], ['stable'], ['stable', 'minor'], ['stable', '3.17.3'],
  ['stable', '4.0.0-beta.10'], ['stable', '4.00.0'],
  ['beta', '4.0.0'], ['beta', '4.1.0-rc.1'],
  ['stable', '4.0.0', '--npm.tag=beta'],
  ['beta', '4.0.0-beta.10', '--npm.tag=latest'],
  ['stable', '4.0.0', '--git.requireBranch=false'],
  ['stable', '4.0.0', '--config=other.json'],
  ['stable', '4.0.0', '--no-increment'],
  ['stable', '4.0.0', '--', '--dry-run'],
])('rejects invalid versions or policy overrides before any command: %j', (...args) => {
  const deps = fixture();
  expect(() => runRelease(args, deps)).toThrow();
  expect(deps.execFileSync).not.toHaveBeenCalled();
});

it.each(['main', 'v4-refactor', ''])('rejects branch %s before verification or release', branch => {
  const deps = fixture({branch});
  expect(() => runRelease(['stable', '4.0.0'], deps)).toThrow('Releases require branch v4');
  expect(deps.execFileSync).toHaveBeenCalledTimes(1);
});

it('rejects uncommitted changes before verification or release', () => {
  const deps = fixture({status: ' M package.json'});
  expect(() => runRelease(['stable', '4.0.0'], deps)).toThrow('clean working tree');
  expect(deps.execFileSync).toHaveBeenCalledTimes(2);
});

it('does not start the release tool after a failed quality gate', () => {
  const deps = fixture({failVerification: true});
  expect(() => runRelease(['stable', '4.0.0'], deps)).toThrow('verification failed');
  expect(deps.execFileSync).toHaveBeenCalledTimes(4);
});

it('preserves dry-run as an option recognized by the release-it parser', () => {
  const parse = require('yargs-parser');
  const parsed = parse(releaseArguments(['stable', '4.0.0', '--dry-run']), {
    boolean: ['dry-run', 'ci'],
    configuration: {'camel-case-expansion': false},
  });
  expect(parsed['dry-run']).toBe(true);
  expect(parsed._).toEqual(['4.0.0']);
});

it('automatically increments only the current beta series and forwards dry-run', () => {
  const deps = fixture();
  runRelease(['beta', '--dry-run'], deps);
  const forwarded = deps.execFileSync.mock.calls[4][1];
  expect(forwarded).toContain('4.0.0-beta.10');
  expect(forwarded).toContain('--dry-run');
  expect(deps.log).toHaveBeenCalledWith('Selected release: react-native-nfc-manager@4.0.0-beta.10');
});

it.each(['4.0.0', '4.1.0-rc.0', '3.17.2'])('requires a new beta series after %s', currentVersion => {
  const deps = fixture({currentVersion});
  expect(() => runRelease(['beta', '--dry-run'], deps)).toThrow('explicit version');
  expect(deps.execFileSync).not.toHaveBeenCalled();
});

it('keeps an explicitly prepared beta version instead of incrementing it', () => {
  const deps = fixture({currentVersion: '4.0.0-beta.10'});
  runRelease(['beta', '4.0.0-beta.10', '--dry-run'], deps);
  expect(deps.execFileSync.mock.calls[4][1]).toContain('4.0.0-beta.10');
});

it('can start an explicitly selected new beta series after stable', () => {
  expect(releaseArguments(['beta', '4.1.0-beta.0'], '4.0.0')[0]).toBe('4.1.0-beta.0');
});

it.each([
  {published: ['4.0.0-beta.10']},
  {published: '4.0.0-beta.10'},
  {registryError: true},
  {published: null},
])('stops before checks or release when version availability cannot be established: %j', options => {
  const deps = fixture(options);
  expect(() => runRelease(['beta'], deps)).toThrow();
  expect(deps.execFileSync).toHaveBeenCalledTimes(3);
});
