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
    });

    it('init a git repo, check again', function() {
        shell.exec('git init');
        gitCommit('Init commit');
        let ret = standardRelease('-i');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
    });

    it('git repo not exist', function() {
        shell.exec('git init');
        gitCommit('Init commit');
        let ret = standardRelease('-i x');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        const emsg = path.resolve(__dirname, 'tmp', 'x') + "'\n";
        chai.expect(ret.stderr).to.equal("ERROR: Do not exist '" + emsg);
    });

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

    const commitMsgFile = 'commit-msg-file';
    function writeCommitMsgToFile(msg) {
        fs.writeFileSync(commitMsgFile, msg, 'utf8');
    }

    function readCommitMsgFromFile() {
        return fs.readFileSync(commitMsgFile, 'utf8');
    }

    it('Merge branch plugins', function() {
        const commitMsg = 'Merge branch plugins';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.equal('INFO: Merge commit detected, skip.\n');
        chai.expect(ret.stderr).to.empty;

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.equal('INFO: Merge commit detected, skip.\n');
        chai.expect(ret.stderr).to.empty;

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('header message format error', function() {
        const commitMsg = 'header message format error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build:no space after colon', function() {
        const commitMsg = 'build:no space after colon';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build(: scope error', function() {
        const commitMsg = 'build(: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build(os: scope error', function() {
        const commitMsg = 'build(os: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build(os]: scope error', function() {
        const commitMsg = 'build(os]: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build(os}: scope error', function() {
        const commitMsg = 'build(os}: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build(): scope error', function() {
        const commitMsg = 'build(): scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build(network): ok', function() {
        const commitMsg = 'build(network): network module build deps';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('chore(API): scope lowercase auto convert', function() {
        const commitMsg = 'chore(API): scope lowercase auto convert';
        const autoFixedMsg = 'chore(api): scope lowercase auto convert';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: Autofix <scope>: API => api\n');
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: Autofix <scope>: API => api\n');
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
    });

    it('build[: scope error', function() {
        const commitMsg = 'build[: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build[net: scope error', function() {
        const commitMsg = 'build[net: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build[net): scope error', function() {
        const commitMsg = 'build[net): scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build[net}: scope error', function() {
        const commitMsg = 'build[net}: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build[]: scope error', function() {
        const commitMsg = 'build[]: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build[deps]: scope error', function() {
        const commitMsg = 'build[deps]: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build{: scope error', function() {
        const commitMsg = 'build{: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build{ui: scope error', function() {
        const commitMsg = 'build{ui: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build{ui): scope error', function() {
        const commitMsg = 'build{ui): scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build{ui]: scope error', function() {
        const commitMsg = 'build{ui]: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build{}: scope error', function() {
        const commitMsg = 'build{}: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build{system}: scope error', function() {
        const commitMsg = 'build{system}: scope error';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: ' + commitMsg + '\n');
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Do NOT match format: "<type>(<scope>): <subject>"\n');

        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('build: Start upper case', function() {
        const commitMsg = 'build: Start upper case';
        const autoFixedMsg = 'build: start upper case';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: Autofix <subject>: Start upper case => start upper case\n');
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal('INFO: Autofix <subject>: Start upper case => start upper case\n');
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
    });

    it('header empty', function() {
        const commitMsg = '\n\nthis is body';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Aborting commit due to empty <header> message.\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Aborting commit due to empty <header> message.\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Aborting commit due to empty <header> message.\n');

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Aborting commit due to empty <header> message.\n');
    });

    it('invalid header type', function() {
        const commitMsg = 'invalid: invalid type';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        const stderrMsg = "ERROR: 'invalid' not valid types of: "
            + 'major, break, breaking, minor, feat, feature, patch, fix, bugfix, '
            + 'ci, docs, perf, test, style, build, chore, revert, refactor\n';
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal(stderrMsg);

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal(stderrMsg);

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal(stderrMsg);

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal(stderrMsg);
    });

    it('buIld: Start upper case', function() {
        const commitMsg = 'buIld: Start upper case';
        const autoFixedMsg = 'build: start upper case';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        let stdoutMsg = 'INFO: Autofix <type>: buIld => build\n'
            + 'INFO: Autofix <subject>: Start upper case => start upper case\n';
        chai.expect(ret.stdout).to.equal(stdoutMsg);
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal(stdoutMsg);
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
    });

    it('buIld(API): Start upper case', function() {
        const commitMsg = 'buIld(API): Start upper case';
        const autoFixedMsg = 'build(api): start upper case';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        let stdoutMsg = 'INFO: Autofix <type>: buIld => build\n'
            + 'INFO: Autofix <scope>: API => api\n'
            + 'INFO: Autofix <subject>: Start upper case => start upper case\n';
        chai.expect(ret.stdout).to.equal(stdoutMsg);
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal(stdoutMsg);
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
    });

    it('buIld(API|Network): Start upper case', function() {
        const commitMsg = 'buIld(API|Network): Start upper case';
        const autoFixedMsg = 'build(api|network): start upper case';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        let stdoutMsg = 'INFO: Autofix <type>: buIld => build\n'
            + 'INFO: Autofix <scope>: API|Network => api|network\n'
            + 'INFO: Autofix <subject>: Start upper case => start upper case\n';
        chai.expect(ret.stdout).to.equal(stdoutMsg);
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        ret = standardRelease('-x -m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.equal(stdoutMsg);
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: Abort for fail on warnings\n');
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);

        ret = standardRelease('-x -m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
    });
});

describe('standard-release --message(usr config)', function() {
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
        const usrConfigData = "exports.attr = {\n"
            + "    commitRules: {\n"
            + "        header: {\n"
            + "            type: [\n"
            + "                { skip: false, isFilter: true, name: 'typea' },\n"
            + "                { skip: false, isFilter: true, name: 'typeb' },\n"
            + "            ],\n"
            + "            scope: function(scopeMsg) {\n"
            + "                if(scopeMsg == 'ok') {\n"
            + "                    return { ok: true };\n"
            + "                } else if(scopeMsg == 'autofix') {\n"
            + "                    return { ok: true, autofix: 'newScopeMsg' };\n"
            + "                } else {\n"
            + "                    return { ok: false, emsg: 'ScopeInvalid' };\n"
            + "                }\n"
            + "            },\n"
            + "            subject: function(subjectMsg) {\n"
            + "                if(subjectMsg == 'ok') {\n"
            + "                    return { ok: true };\n"
            + "                } else if(subjectMsg == 'autofix') {\n"
            + "                    return { ok: true, autofix: 'newSubjectMsg' };\n"
            + "                } else {\n"
            + "                    return { ok: false, emsg: 'SubjectInvalid' };\n"
            + "                }\n"
            + "            },\n"
            + "        },\n"
            + "        body: function(bodyMsg) {\n"
            + "            if(bodyMsg == 'ok') {\n"
            + "                return { ok: true };\n"
            + "            } else if(bodyMsg == 'autofix') {\n"
            + "                return { ok: true, autofix: 'newBodyMsg' };\n"
            + "            } else {\n"
            + "                return { ok: false, emsg: 'BodyInvalid' };\n"
            + "            }\n"
            + "        },\n"
            + "        footer: function(footerMsg) {\n"
            + "            if(footerMsg == 'ok') {\n"
            + "                return { ok: true };\n"
            + "            } else if(footerMsg == 'autofix') {\n"
            + "                return { ok: true, autofix: 'newFooterMsg' };\n"
            + "            } else {\n"
            + "                return { ok: false, emsg: 'FooterInvalid' };\n"
            + "            }\n"
            + "        }\n"
            + "    }\n"
            + "}";
        shell.exec('echo "' + usrConfigData + '" > .standard-release/config.js');
    });

    afterEach(function() {
        shell.cd('../');
        shell.rm('-rf', 'tmp');
    });

    const commitMsgFile = 'commit-msg-file';
    function writeCommitMsgToFile(msg) {
        fs.writeFileSync(commitMsgFile, msg, 'utf8');
    }

    function readCommitMsgFromFile() {
        return fs.readFileSync(commitMsgFile, 'utf8');
    }

    it('invalid type', function() {
        const commitMsg = 'invalid: invalid type';
        let ret = standardRelease('-m "' + commitMsg + '"');
        chai.expect(ret.code).to.equal(1);
        const stderrMsg = "ERROR: 'invalid' not valid types of: typea, typeb\n";
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal(stderrMsg);

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal(stderrMsg);
    });

    it('ok', function() {
        const commitMsg = 'typea(ok): ok\n\nok\n\nok';
        let data = shell.exec('echo -n "' + commitMsg + '"');
        let ret = standardRelease('-m "' + data.stdout + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
    });

    it('scope autofix', function() {
        const commitMsg = 'typea(autofix): ok\n\nok\n\nok';
        const autoFixedMsg = 'typea(newScopeMsg): ok\n\nok\n\nok';
        const data = shell.exec('echo -n "' + commitMsg + '"');
        let ret = standardRelease('-m "' + data.stdout + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
    });

    it('subject error', function() {
        const commitMsg = 'typea(autofix): error\n\nok\n\nok';
        const data = shell.exec('echo -n "' + commitMsg + '"');
        let ret = standardRelease('-m "' + data.stdout + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: <subject> invalid because SubjectInvalid\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: <subject> invalid because SubjectInvalid\n');
        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('body error', function() {
        const commitMsg = 'typea(autofix): ok\n\nerror\n\nok';
        const data = shell.exec('echo -n "' + commitMsg + '"');
        let ret = standardRelease('-m "' + data.stdout + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: <body> invalid because BodyInvalid\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: <body> invalid because BodyInvalid\n');
        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('footer error', function() {
        const commitMsg = 'typea(autofix): ok\n\nok\n\nerror';
        const data = shell.exec('echo -n "' + commitMsg + '"');
        let ret = standardRelease('-m "' + data.stdout + '"');
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: <footer> invalid because FooterInvalid\n');

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(1);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.equal('ERROR: <footer> invalid because FooterInvalid\n');
        chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
    });

    it('subject autofix', function() {
        const commitMsg = 'typea(autofix): autofix\n\nok\n\nok';
        const autoFixedMsg = 'typea(newScopeMsg): newSubjectMsg\n\nok\n\nok';
        const data = shell.exec('echo -n "' + commitMsg + '"');
        let ret = standardRelease('-m "' + data.stdout + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
    });

    it('body autofix', function() {
        const commitMsg = 'typea(autofix): autofix\n\nautofix\n\nok';
        const autoFixedMsg = 'typea(newScopeMsg): newSubjectMsg\n\nnewBodyMsg\n\nok';
        const data = shell.exec('echo -n "' + commitMsg + '"');
        let ret = standardRelease('-m "' + data.stdout + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
    });

    it('footer autofix', function() {
        const commitMsg = 'typea(autofix): autofix\n\nautofix\n\nautofix';
        const autoFixedMsg = 'typea(newScopeMsg): newSubjectMsg\n\nnewBodyMsg\n\nnewFooterMsg';
        const data = shell.exec('echo -n "' + commitMsg + '"');
        let ret = standardRelease('-m "' + data.stdout + '"');
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;

        writeCommitMsgToFile(commitMsg);
        ret = standardRelease('-m ' + commitMsgFile);
        chai.expect(ret.code).to.equal(0);
        chai.expect(ret.stdout).to.empty;
        chai.expect(ret.stderr).to.empty;
        chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
    });
});
