'use strict';

const {
  MATRIX,
  parseArgs,
  runMatrix,
} = require('./codegen-compatibility');

function main() {
  const options = parseArgs(process.argv.slice(2));
  const results = runMatrix(options);

  console.log('\nReact Native Codegen compatibility summary:');
  for (const result of results) {
    const {entry, androidFiles, iosFiles} = result;
    console.log(
      `- RN ${entry.reactNative} (${entry.role}): Android ${androidFiles.length} files, iOS ${iosFiles.length} files`,
    );
  }
  console.log(
    `Validated ${results.length}/${options.version ? 1 : MATRIX.length} selected matrix entries.`,
  );
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
