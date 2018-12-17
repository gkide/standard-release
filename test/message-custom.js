'use strict';

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const shell = require('shelljs');

function runTesting(standardRelease) {
    const workingDirectory = path.resolve(__dirname, '..', 'tmp');
    describe('standard-release --message(usr config)', function() {
        beforeEach(function() {
            shell.rm('-rf', 'tmp');
            shell.mkdir('tmp');
            shell.cd('tmp');
            shell.exec('git init');
            standardRelease('-i');
            const usrConfigData = "exports.attr = {\n"
                + "    commitRules: {\n"
                + "        header: {\n"
                + "            maxLength: 100,\n"
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

        it('valid commit', function() {
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

        it('header message too long', function() {
            let commitMsg = 'typea(ok): long header message more then 100 characters,'
                + 'long header message more then 100 characters,'
                + 'long header message more then 100 characters';
            let ret = standardRelease('-m "' + commitMsg + '"');
            chai.expect(ret.code).to.equal(1);
            let stderrMsg = "ERROR: Header is longer than 100 chars\n";
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(stderrMsg);
        });
    });
}

exports.runTesting = runTesting;
