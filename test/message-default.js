'use strict';

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const shell = require('shelljs');

function runTesting(standardRelease) {
    const workingDirectory = path.resolve(__dirname, '..', 'tmp');
    describe('standard-release --message', function() {
        beforeEach(function() {
            shell.rm('-rf', 'tmp');
            shell.mkdir('tmp');
            shell.cd('tmp');
            shell.exec('git init');
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

        it('header message too long', function() {
            let commitMsg = 'build: long header message more then 80 characters,'
                + 'long header message more then 80 characters,'
                + 'long header message more then 80 characters';
            let ret = standardRelease('-m "' + commitMsg + '"');
            chai.expect(ret.code).to.equal(1);
            let stderrMsg = "ERROR: Header is longer than 80 chars\n";
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);
        });

        it('skip Working In Processing(wip)', function() {
            const commitMsg = 'wip: subject\n\nboddy\n\n';
            const data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.equal('INFO: Commit message validation ignored for wip\n');
            chai.expect(ret.stderr).to.empty;

            ret = standardRelease('-x -m "' + commitMsg + '"');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.equal('INFO: Commit message validation ignored for wip\n');
            chai.expect(ret.stderr).to.empty;
            chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-x -m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
            chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
        });

        it('footer error', function() {
            let commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + 'footer';
            let data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            const stderrMsg = 'ERROR: <footer> invalid because not one of:\n'
                + '[CLOSE] ... or [CLOSE#XXX] ...\n'
                + '[KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...\n'
                + '[BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...\n';
            chai.expect(ret.stderr).to.equal(stderrMsg);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);
        });

        it('footer [CLOSE]', function() {
            let commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[CLOSE] fix user config file crash';
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

            commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[CLOSE#1] fix user config file crash';
            data = shell.exec('echo -n "' + commitMsg + '"');
            ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;

            commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[CLOSE#] fix user config file crash';
            const stderrMsg = 'ERROR: <footer> invalid because not one of:\n'
                + '[CLOSE] ... or [CLOSE#XXX] ...\n'
                + '[KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...\n'
                + '[BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...\n';
            data = shell.exec('echo -n "' + commitMsg + '"');
            ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);
        });

        it('footer [KNOWN ISSUE]', function() {
            let commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[KNOWN ISSUE] the tcp connect to server may failed';
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

            commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[KNOWN ISSUE#1] the tcp connect to server may failed';
            data = shell.exec('echo -n "' + commitMsg + '"');
            ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;

            commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[KNOWN ISSUE#] the tcp connect to server may failed';
            const stderrMsg = 'ERROR: <footer> invalid because not one of:\n'
                + '[CLOSE] ... or [CLOSE#XXX] ...\n'
                + '[KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...\n'
                + '[BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...\n';
            data = shell.exec('echo -n "' + commitMsg + '"');
            ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);
        });

        it('footer [BREAKING CHANGES]', function() {
            let commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[BREAKING CHANGES] rename API: libthisAPI() => libthatAPI()';
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

            commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[BREAKING CHANGES#1] libthisAPI() => libthatAPI()';
            data = shell.exec('echo -n "' + commitMsg + '"');
            ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;

            commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[BREAKING CHANGES#] rename API: libthisAPI() => libthatAPI()';
            const stderrMsg = 'ERROR: <footer> invalid because not one of:\n'
                + '[CLOSE] ... or [CLOSE#XXX] ...\n'
                + '[KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...\n'
                + '[BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...\n';
            data = shell.exec('echo -n "' + commitMsg + '"');
            ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);
        });

        it('footer with comments', function() {
            let commitMsg = 'build: subject\n\n'
                + 'boddy\n\n'
                + '[KNOWN ISSUE#135] THIS IS AN ISSUE\n'
                + '[KNOWN ISSUE#178] THIS IS ISSUE 1\n'
                + '[KNOWN ISSUE#298] THIS IS ISSUE 2\n'
                + '[CLOSE] close a important bug\n'
                + '[CLOSE#1] close issue again\n'
                + '[CLOSE#15] close issue not import\n'
                + '[CLOSE#125] close an issue again\n'
                + '[BREAKING CHANGES] this is ui breaking change\n'
                + '[BREAKING CHANGES#158] this is lib breaking change\n'
                + '[BREAKING CHANGES#782] this is core breaking change\n'
                + '[BREAKING CHANGES#054] all breaking changed\n'
                + '#comment lines start by #\n'
                + '# will auto remove, they will not\n'
                + '#a part of the commit message\n';
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
    });
}

exports.runTesting = runTesting;
