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

// standard-release -i
const initSuite = path.resolve(__dirname, 'init.js');
require(initSuite).runTesting(standardRelease);

// standard-release -m, use default configuration commit rules 
const msgDefaultSuite = path.resolve(__dirname, 'message-default.js');
require(msgDefaultSuite).runTesting(standardRelease);

// standard-release -m, use custom configuration commit rules
const msgCustomSuite = path.resolve(__dirname, 'message-custom.js');
require(msgCustomSuite).runTesting(standardRelease);

// package: git semver tags
const GitTagsSuite = path.resolve(__dirname, 'package', 'gitTags.js');
require(GitTagsSuite).runTesting();
