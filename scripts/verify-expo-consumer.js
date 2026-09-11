#!/usr/bin/env node
'use strict';

const {parseArgs, runExpoConsumer} = require('./expo-consumer');

try {
  runExpoConsumer(parseArgs(process.argv.slice(2)));
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
