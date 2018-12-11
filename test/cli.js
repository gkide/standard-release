'use strict';


const path = require('path');
const stream = require('stream');
const semver = require('semver');
const shell = require('shelljs');
const chai = require('chai');

const git = path.resolve(__dirname, 'git.js');
const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');

function standardRelease(argString) {
    return shell.exec('node ' + cliPath + (argString != null ? ' ' + argString : ''))
}

function getPackageVersion() {
    return JSON.parse(fs.readFileSync('package.json', 'utf-8')).version;
}

// Suppresses all command output if true, except for echo() calls.
shell.config.silent = true;

let testSuite

// standard-release -i
testSuite = require(path.resolve(__dirname, 'init.js'));
testSuite.runTesting(standardRelease);

// standard-release -m
testSuite = require(path.resolve(__dirname, 'message-default.js'));
testSuite.runTesting(standardRelease);
testSuite = require(path.resolve(__dirname, 'message-custom.js'));
testSuite.runTesting(standardRelease);
