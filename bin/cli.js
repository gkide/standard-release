#!/usr/bin/env node

'use strict';

// Native
const path = require('path');

// Packages
const semver = require('semver');
const shell = require('shelljs');

// Utils
const pkg = require('../package.json');

if(!semver.satisfies(process.version, pkg.engines.node)) {
  console.error(
`[standard-release]: node version ${pkg.engines.node} is required. Found ${process.version}.

You may need to download new node package from https://nodejs.org/en/download`
  );
  process.exit(1);
}

shell.config.silent = true;
const MIN_GIT_VERSION = '2.7.1';
let gitVersion = shell.exec('git --version');
if(gitVersion.code != 0) {
  console.error("[standard-release]: run 'git --version' error, STOP!")
  process.exit(1);
}

gitVersion = gitVersion.stdout.replace(/\n/, '');
gitVersion = gitVersion.replace(/^git\sversion\s/, '');

if(semver.lt(gitVersion, MIN_GIT_VERSION)) {
  console.error(
`[standard-release]: Git version ${MIN_GIT_VERSION} is required. Found ${gitVersion}.`
);
  process.exit(1);
}

require(path.join(__dirname, '..', 'helper')).standardRelease();
