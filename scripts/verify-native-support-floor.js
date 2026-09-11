'use strict';

const {
  SUPPORT_FLOOR,
  parseArgs,
  runSupportFloor,
} = require('./native-support-floor');

function main() {
  const options = parseArgs(process.argv.slice(2));
  const result = runSupportFloor(options);
  console.log(
    `Validated RN ${
      SUPPORT_FLOOR.reactNative
    } native support floor for ${result.platforms.join(
      ' and ',
    )} using react-native-nfc-manager ${result.installedVersion}.`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
