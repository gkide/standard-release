'use strict';

// Native
const path = require('path');
const stream = require('stream');

// Packages
const chai = require('chai');
const semver = require('semver');
const shell = require('shelljs');

// Utilities
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
const myGit = path.resolve(__dirname, 'package', 'myGit.js');
require(myGit).runTesting();

// standard-release -i
const init = path.resolve(__dirname, 'init.js');
require(init).runTesting(standardRelease);

// standard-release --is-semver
const isSemVer = path.resolve(__dirname, 'is-semver.js');
require(isSemVer).runTesting(standardRelease);

// standard-release -m, use default commit rules
const defCommitRules = path.resolve(__dirname, 'commit-rules-def.js');
require(defCommitRules).runTesting(standardRelease);

// standard-release -m, use custom commit rules
const usrCommitRules = path.resolve(__dirname, 'commit-rules-usr.js');
require(usrCommitRules).runTesting(standardRelease);
