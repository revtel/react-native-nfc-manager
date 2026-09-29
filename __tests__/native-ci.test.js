'use strict';

const {selectPlatforms, selectForEvent} = require('../scripts/select-native-ci');

it.each([
  [['README.md', 'docs/RELEASING.md'], {android: false, ios: false}],
  [['images/example.png'], {android: false, ios: false}],
  [['android/README.md'], {android: false, ios: false}],
  [['android/src/main/java/NfcManager.java'], {android: true, ios: false}],
  [['example/android/build.gradle'], {android: true, ios: false}],
  [['ios/RNNfcManager.swift'], {android: false, ios: true}],
  [['example/Gemfile.lock'], {android: false, ios: true}],
  [['react-native-nfc-manager.podspec'], {android: false, ios: true}],
  [['specs/NativeNfcManager.ts'], {android: true, ios: true}],
  [['src/NfcManager.ts'], {android: true, ios: true}],
  [['package-lock.json'], {android: true, ios: true}],
  [['.github/workflows/ci.yml'], {android: true, ios: true}],
  [['unexpected-file'], {android: true, ios: true}],
  [['android/old.java', 'docs/new.md'], {android: true, ios: false}],
  [[], {android: false, ios: false}],
])('selects platforms for %j', (files, expected) => {
  expect(selectPlatforms(files)).toEqual(expected);
});

const base = 'a'.repeat(40);
const head = 'b'.repeat(40);
const common = 'c'.repeat(40);

it('uses the complete PR diff from the merge base, not just the latest commit', () => {
  const git = jest.fn().mockReturnValueOnce(`${common}\n`).mockReturnValueOnce('README.md\0ios/Nfc.swift\0');
  expect(selectForEvent('pull_request', {pull_request: {base: {sha: base}, head: {sha: head}}}, git))
    .toEqual({android: false, ios: true});
  expect(git.mock.calls[1][1]).toEqual(['diff', '--name-only', '--no-renames', '-z', common, head]);
});

it('uses both ends of the push range', () => {
  const git = jest.fn().mockReturnValue('docs/guide.md\0');
  expect(selectForEvent('push', {before: base, after: head}, git)).toEqual({android: false, ios: false});
  expect(git.mock.calls[0][1].slice(-2)).toEqual([base, head]);
});

it('forces both builds for manual candidate validation', () => {
  expect(selectForEvent('workflow_dispatch', {})).toEqual({android: true, ios: true});
});

it.each([{}, {before: '0'.repeat(40), after: head}, {before: '--invalid', after: head}])('runs both if push metadata is incomplete: %j', event => {
  const git = jest.fn();
  expect(selectForEvent('push', event, git)).toEqual({android: true, ios: true});
  expect(git).not.toHaveBeenCalled();
});

it('runs both when a diff cannot be read', () => {
  const warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    expect(selectForEvent('push', {before: base, after: head}, () => { throw new Error('missing object'); }))
      .toEqual({android: true, ios: true});
  } finally {
    warning.mockRestore();
  }
});

it.each([
  ['success', 'false', 'skipped', 'false', 'skipped', 0],
  ['success', 'true', 'success', 'true', 'success', 0],
  ['success', 'true', 'failure', 'false', 'skipped', 1],
  ['success', 'true', 'skipped', 'false', 'skipped', 1],
  ['success', 'false', 'skipped', 'true', 'cancelled', 1],
  ['failure', undefined, 'skipped', undefined, 'skipped', 1],
])('aggregate gate handles selection=%s android=%s/%s ios=%s/%s', (selection, android, androidResult, ios, iosResult, expected) => {
  const fs = require('fs');
  const yaml = require('js-yaml');
  const {spawnSync} = require('child_process');
  const workflow = yaml.load(fs.readFileSync('.github/workflows/ci.yml', 'utf8'));
  const gate = workflow.jobs['native-gate'];
  expect(gate.if).toBe('always()');
  const run = spawnSync('bash', ['-c', gate.steps[0].run], {
    env: {...process.env, NEEDS_JSON: JSON.stringify({
      changes: {result: selection, outputs: {android, ios}},
      android: {result: androidResult}, ios: {result: iosResult},
    })},
  });
  expect(run.status).toBe(expected);
});
