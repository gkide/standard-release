'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const semver = require('semver');
const shell = require('shelljs');

const standardRelease = require('./helper').standardRelease;

function gitBranch(branch) {
    shell.exec('git branch ' + branch);
}

function gitCheckout(branch) {
    shell.exec('git checkout ' + branch);
}

function gitCommit(msg) {
    shell.exec('git commit --allow-empty -m"' + msg + '"');
}

function gitMerge(msg, branch) {
    shell.exec('git merge --no-ff -m"' + msg + '" ' + branch);
}

function getPackageVersion() {
    return JSON.parse(fs.readFileSync('package.json', 'utf-8')).version;
}

function tmpDirInit() {
    shell.rm('-rf', 'tmp');
    shell.config.silent = true;
    shell.mkdir('tmp');
    shell.cd('tmp');
    shell.exec('git init');
    gitCommit('Init commit');
}

function tmpDirClean() {
    shell.cd('../');
    shell.rm('-rf', 'tmp');
}

describe('cli', function() {
    beforeEach(tmpDirInit);
    afterEach(tmpDirClean);

    describe('CHANGELOG.md does not exist', function() {
        it('populates changelog with commits since last tag by default', function() {
            gitCommit('feat: first commit');
            shell.exec('git tag -a v1.0.0 -m "my awesome first release"');
            gitCommit('fix: patch release');
        })

    })
})
