'use strict';

const assert = require('node:assert/strict');
const integer = '(?:0|[1-9][0-9]*)';
const v4Stable = new RegExp(`^4\\.${integer}\\.${integer}$`);
const v4Beta = new RegExp(`^4\\.${integer}\\.${integer}-beta\\.${integer}$`);
const v3Stable = new RegExp(`^3\\.${integer}\\.${integer}$`);

function releasePolicy(branch, version) {
  if (branch === 'main' && v4Stable.test(version)) {
    return {distTag: 'latest', prerelease: false, requiresNativeCi: true};
  }
  if (['main', 'v4'].includes(branch) && v4Beta.test(version)) {
    return {distTag: 'beta', prerelease: true, requiresNativeCi: true};
  }
  if (branch === 'v3' && v3Stable.test(version)) {
    return {distTag: 'legacy', prerelease: false, requiresNativeCi: false};
  }
  assert.fail('Unsupported release branch/version: main permits v4 stable/beta, v4 permits v4 beta, v3 permits v3 stable under legacy');
}

module.exports = {releasePolicy};
