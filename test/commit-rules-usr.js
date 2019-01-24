'use strict';

const fs = require('fs');
const path = require('path');
const chai = require('chai');
const shell = require('shelljs');

// user commit rules header, body, footer hooks
const usrCR_HBF =  "    header: {\n"
    + "        maxLength: 100,\n"
    + "        type: [\n"
    + "            { skip: false, isFilter: true, name: 'typea' },\n"
    + "            { skip: false, isFilter: true, name: 'typeb' },\n"
    + "        ],\n"
    + "        scope: function(scopeMsg) {\n"
    + "            if(scopeMsg == 'ok') {\n"
    + "                return { ok: true };\n"
    + "            } else if(scopeMsg == 'autofix') {\n"
    + "                return { ok: true, autofix: 'newScopeMsg' };\n"
    + "            } else {\n"
    + "                return { ok: false, emsg: 'ScopeInvalid' };\n"
    + "            }\n"
    + "        },\n"
    + "        subject: function(subjectMsg) {\n"
    + "            if(subjectMsg == 'ok') {\n"
    + "                return { ok: true };\n"
    + "            } else if(subjectMsg == 'autofix') {\n"
    + "                return { ok: true, autofix: 'newSubjectMsg' };\n"
    + "            } else {\n"
    + "                return { ok: false, emsg: 'SubjectInvalid' };\n"
    + "            }\n"
    + "        },\n"
    + "    },"
    + "    body: function(bodyMsg) {\n"
    + "        if(bodyMsg == 'ok') {\n"
    + "            return { ok: true };\n"
    + "        } else if(bodyMsg == 'autofix') {\n"
    + "            return { ok: true, autofix: 'newBodyMsg' };\n"
    + "        } else {\n"
    + "            return { ok: false, emsg: 'BodyInvalid' };\n"
    + "        }\n"
    + "    },\n"
    + "    footer: function(footerMsg) {\n"
    + "        if(footerMsg == 'ok') {\n"
    + "            return { ok: true };\n"
    + "        } else if(footerMsg == 'autofix') {\n"
    + "            return { ok: true, autofix: 'newFooterMsg' };\n"
    + "        } else {\n"
    + "            return { ok: false, emsg: 'FooterInvalid' };\n"
    + "        }\n"
    + "    }\n";

function writeUsrCommitRulesF() {
    const usrCommitRulesF = "exports.commitRules = {\n"
        + "    failOnAutoFix: false,\n"
        + usrCR_HBF
        + "}";
    shell.exec('echo "' + usrCommitRulesF + '" > .standard-release/commit.js');
}

function writeUsrCommitRulesT() {
    const usrCommitRulesF = "exports.commitRules = {\n"
        + "    failOnAutoFix: true,\n"
        + usrCR_HBF
        + "}";
    shell.exec('echo "' + usrCommitRulesF + '" > .standard-release/commit.js');
}

function run(standardRelease, usrCommitRulesGenerator, failOnAutoFix) {
    const workingDirectory = path.resolve(__dirname, '..', 'tmp');
    let prmptMsg
    if(failOnAutoFix) {
        prmptMsg = 'usr rules, fail-on-auto-fix=true';
    } else {
        prmptMsg = 'usr rules, fail-on-auto-fix=false';
    }
    describe('standard-release --message, ' + prmptMsg, function() {
        before(function() {
            shell.rm('-rf', 'tmp');
            shell.mkdir('tmp');
            shell.cd('tmp');
            shell.exec('git init');
            standardRelease('-i');
            usrCommitRulesGenerator();
        });

        after(function() {
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

        const EMSG_failOnAutoFix = "ERROR: Abort for fail on warnings\n";
        const EMSG_headerTypes = "ERROR: 'invalid' not valid types of: typea, typeb\n";
        const EMSG_headerLength = "ERROR: Header is longer than 100 chars\n";
        const EMSG_SubjectInvalid = "ERROR: <subject> invalid because SubjectInvalid\n";
        const EMSG_bodyInvalid = "ERROR: <body> invalid because BodyInvalid\n";
        const EMSG_footerInvalid = "ERROR: <footer> invalid because FooterInvalid\n";

        it('invalid type', function() {
            const commitMsg = 'invalid: invalid type';
            let ret = standardRelease('-m "' + commitMsg + '"');
            chai.expect(ret.code).to.equal(1);

            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_headerTypes);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_headerTypes);
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
            const data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            if(failOnAutoFix) {
                chai.expect(ret.code).to.equal(1);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.equal(EMSG_failOnAutoFix);
            } else {
                chai.expect(ret.code).to.equal(0);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.empty;
            }

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            if(failOnAutoFix) {
                chai.expect(ret.code).to.equal(1);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.equal(EMSG_failOnAutoFix);
            } else {
                chai.expect(ret.code).to.equal(0);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.empty;
                const autoFixedMsg = 'typea(newScopeMsg): ok\n\nok\n\nok';
                chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
            }
        });

        it('subject invalid', function() {
            const commitMsg = 'typea(autofix): error\n\nok\n\nok';
            const data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_SubjectInvalid);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_SubjectInvalid);
            chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
        });

        it('body invalid', function() {
            const commitMsg = 'typea(autofix): ok\n\nerror\n\nok';
            const data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_bodyInvalid);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_bodyInvalid);
            chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
        });

        it('footer invalid', function() {
            const commitMsg = 'typea(autofix): ok\n\nok\n\nerror';
            const data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_footerInvalid);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_footerInvalid);
            chai.expect(readCommitMsgFromFile()).to.equal(commitMsg);
        });

        it('subject autofix', function() {
            const commitMsg = 'typea(autofix): autofix\n\nok\n\nok';
            const data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            if(failOnAutoFix) {
                chai.expect(ret.code).to.equal(1);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.equal(EMSG_failOnAutoFix);
            } else {
                chai.expect(ret.code).to.equal(0);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.empty;
            }

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            if(failOnAutoFix) {
                chai.expect(ret.code).to.equal(1);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.equal(EMSG_failOnAutoFix);
            } else {
                chai.expect(ret.code).to.equal(0);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.empty;
                const autoFixedMsg = 'typea(newScopeMsg): newSubjectMsg\n\nok\n\nok';
                chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
            }
        });

        it('body autofix', function() {
            const commitMsg = 'typea(autofix): autofix\n\nautofix\n\nok';
            const data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            if(failOnAutoFix) {
                chai.expect(ret.code).to.equal(1);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.equal(EMSG_failOnAutoFix);
            } else {
                chai.expect(ret.code).to.equal(0);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.empty;
            }

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            if(failOnAutoFix) {
                chai.expect(ret.code).to.equal(1);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.equal(EMSG_failOnAutoFix);
            } else {
                chai.expect(ret.code).to.equal(0);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.empty;
                const autoFixedMsg = 'typea(newScopeMsg): newSubjectMsg\n\nnewBodyMsg\n\nok';
                chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
            }
        });

        it('footer autofix', function() {
            const commitMsg = 'typea(autofix): autofix\n\nautofix\n\nautofix';
            const data = shell.exec('echo -n "' + commitMsg + '"');
            let ret = standardRelease('-m "' + data.stdout + '"');
            if(failOnAutoFix) {
                chai.expect(ret.code).to.equal(1);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.equal(EMSG_failOnAutoFix);
            } else {
                chai.expect(ret.code).to.equal(0);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.empty;
            }

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            if(failOnAutoFix) {
                chai.expect(ret.code).to.equal(1);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.equal(EMSG_failOnAutoFix);
            } else {
                chai.expect(ret.code).to.equal(0);
                chai.expect(ret.stdout).to.empty;
                chai.expect(ret.stderr).to.empty;
                const autoFixedMsg = 'typea(newScopeMsg): newSubjectMsg\n\nnewBodyMsg\n\nnewFooterMsg';
                chai.expect(readCommitMsgFromFile()).to.equal(autoFixedMsg);
            }
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
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_headerLength);

            writeCommitMsgToFile(commitMsg);
            ret = standardRelease('-m ' + commitMsgFile);
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.equal(EMSG_headerLength);
        });
    });
}

function runTesting(standardRelease) {
    run(standardRelease, writeUsrCommitRulesT, true);
    run(standardRelease, writeUsrCommitRulesF, false);
}

exports.runTesting = runTesting;
