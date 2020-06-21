'use strict';

// Native
const path = require('path');

// Packages
const shell = require('shelljs');

// Utilities
const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');

function standardRelease(argString) {
  return shell.exec('node ' + cliPath + (argString != null ? ' ' + argString : ''))
}

// Suppresses all command output if true, except for echo() calls.
shell.config.silent = true;

exports.standardRelease = standardRelease;
