'use strict';


const path = require('path');
const stream = require('stream');
const semver = require('semver');
const shell = require('shelljs');
const chai = require('chai');

const cliPath = path.resolve(__dirname, '..', 'bin', 'cli.js');

function standardRelease(argString) {
    return shell.exec('node ' + cliPath + (argString != null ? ' ' + argString : ''))
}

function getPackageVersion() {
    return JSON.parse(fs.readFileSync('package.json', 'utf-8')).version;
}

// Suppresses all command output if true, except for echo() calls.
shell.config.silent = true;

// package: git semver tags
const myGitSuite = path.resolve(__dirname, 'package', 'myGit.js');
require(myGitSuite).runTesting();

// standard-release -i
const initSuite = path.resolve(__dirname, 'init.js');
require(initSuite).runTesting(standardRelease);

// standard-release -m, use default configuration commit rules 
const msgDefaultSuite = path.resolve(__dirname, 'message-default.js');
require(msgDefaultSuite).runTesting(standardRelease);

// standard-release -m, use custom configuration commit rules
const msgCustomSuite = path.resolve(__dirname, 'message-custom.js');
require(msgCustomSuite).runTesting(standardRelease);

