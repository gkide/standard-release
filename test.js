'use strict';

const fs = require('fs');
const path = require('path');
const stream = require('stream');
const semver = require('semver');
const shell = require('shelljs');
const chai = require('chai');

const cliPath = path.resolve(__dirname, 'bin', 'cli.js');

function standardRelease(argString) {
  return shell.exec('node ' + cliPath + (argString != null ? ' ' + argString : ''))
}

function gitTag(tag, msg) {
    shell.exec('git tag -a ' + tag + ' -m "' + msg + '"');
}

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

// Suppresses all command output if true, except for echo() calls.
shell.config.silent = true;

describe('standard-release --init', function() {
    beforeEach(function() {
        shell.rm('-rf', 'tmp');
        shell.mkdir('tmp');
        shell.cd('tmp');
    });
    afterEach(function() {
        shell.cd('../');
        shell.rm('-rf', 'tmp');
    });

    it('it is not a git repo', function() {
        let ret = standardRelease('-i');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        const emsg = path.resolve(__dirname, 'tmp', '.git') + "'\n";
        chai.expect(ret.stderr).to.equal("ERROR: Do not find '" + emsg);
    })
    it('init a git repo, check again', function() {
        shell.exec('git init');
        gitCommit('Init commit');
        let ret = standardRelease('-i');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
    })
    it('git repo not exist', function() {
        shell.exec('git init');
        gitCommit('Init commit');
        let ret = standardRelease('-i x');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        const emsg = path.resolve(__dirname, 'tmp', 'x') + "'\n";
        chai.expect(ret.stderr).to.equal("ERROR: Do not exist '" + emsg);
    })

})

describe('standard-release --message', function() {
    beforeEach(function() {
        shell.rm('-rf', 'tmp');
        shell.mkdir('tmp');
        shell.cd('tmp');
        shell.exec('git init');
        gitCommit('Init commit');
        shell.exec('touch README.md');
        shell.exec('touch .gitignore');
        shell.exec('echo ".standard-release/" > .gitignore');
        shell.exec('git add .');
        gitCommit('feat: first commit');
        gitTag('v1.0.0', 'my awesome first release');
        standardRelease('-i');
    });
    afterEach(function() {
        shell.cd('../');
        shell.rm('-rf', 'tmp');
    });

    it('bad header: build: Start upper case', function() {
        let ret = standardRelease('-m "build: Start upper case"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
    })
})
