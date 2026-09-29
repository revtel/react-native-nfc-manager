'use strict';

const {execFileSync} = require('child_process');
const {readFileSync, appendFileSync} = require('fs');

function selectPlatforms(files) {
  const result = {android: false, ios: false};
  for (const file of files) {
    if (/\.md$/i.test(file) || /^(docs|images|openspec)\//.test(file)) {
      continue;
    }
    if (/^(android|example\/android)\//.test(file)) {
      result.android = true;
    } else if (/^(ios|example\/ios)\//.test(file) || /\.podspec$/.test(file) || /^example\/Gemfile(?:\.lock)?$/.test(file)) {
      result.ios = true;
    } else {
      // Shared JS, Codegen, dependencies, CI, or unknown files: fail safe.
      result.android = true;
      result.ios = true;
    }
  }
  return result;
}

function selectForEvent(eventName, event, git = execFileSync) {
  if (eventName === 'workflow_dispatch') return {android: true, ios: true};
  let base;
  let head;
  if (eventName === 'pull_request') {
    base = event.pull_request?.base?.sha;
    head = event.pull_request?.head?.sha;
  } else if (eventName === 'push') {
    base = event.before;
    head = event.after;
  }
  const validSha = value => /^[a-f0-9]{40}$/.test(value || '') && !/^0+$/.test(value);
  if (!validSha(base) || !validSha(head)) return {android: true, ios: true};
  try {
    if (eventName === 'pull_request') {
      base = git('git', ['merge-base', base, head], {encoding: 'utf8'}).trim();
    }
    // Include both sides of renames and every path, without API pagination limits.
    const files = git('git', ['diff', '--name-only', '--no-renames', '-z', base, head], {encoding: 'utf8'});
    return selectPlatforms(files.split('\0').filter(Boolean));
  } catch (error) {
    console.warn('Unable to determine changed paths; running both native builds.');
    return {android: true, ios: true};
  }
}

if (require.main === module) {
  const event = JSON.parse(readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const selected = selectForEvent(process.env.GITHUB_EVENT_NAME, event);
  console.log('Native build selection:', selected);
  for (const [platform, enabled] of Object.entries(selected)) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${platform}=${enabled}\n`);
  }
}

module.exports = {selectPlatforms, selectForEvent};
