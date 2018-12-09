'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

const tools = require(path.join(__dirname, 'tools'));
const cfgParser = require(path.join(__dirname, 'cfgParser'));
const gitCommit = require(path.join(__dirname, 'commitParser'));

function validateMsg(helper, commitMsg) {
    let commit = {};
    if(commitMsg) {
        commit = gitCommit.parseCommitFromMsg(helper, commitMsg);
    } else {
        commit = gitCommit.parseCommitFromCmdArgs(helper);
    }

    function autoFixMsg(type, oldVal, newVal) {
        let imsg = 'Autofix <' + helper.colorKeys('blue', { [type]: true }) + '>';
        imsg = imsg + ': ' + helper.colorKeys('yellow', { [oldVal]: true }) + ' => ';
        helper.infoMsg(imsg + helper.colorKeys('green', { [newVal]: true }));
    }

    function warnMsgColor(perfixMsg, key, suffixMsg) {
        const keyMsg = '<' + helper.colorKeys('yellow', { [key]: true }) + '>';
        helper.warnMsg(perfixMsg + keyMsg + suffixMsg);
    }

    function errorMsgColor(perfixMsg, key, suffixMsg) {
        const keyMsg = '<' + helper.colorKeys('blue', { [key]: true }) + '>';
        helper.errorMsg(perfixMsg + keyMsg + suffixMsg);
    }

    let hasWarnings = false;
    const colorKeys = helper.colorKeys;
    const msgRules = helper.getUsrConfig(helper.cfgSym.usrCfgCommitRules);

    if(!commit.headerMsg) {
        errorMsgColor('Aborting commit due to empty ', 'header', ' message.');
        return false;
    }

    if(/^Merge /.test(commit.headerMsg)) {
        helper.infoMsg('Merge commit detected, skip.');
        return true;
    }

    // header length checking
    const headerMaxLength = cfgParser.getHeaderMsgMaxLength(msgRules);
    if(commit.headerMsg.length > headerMaxLength && !commit.headerObj.autosquash) {
        const emsg = util.format("Header is longer than %d chars", headerMaxLength);
        helper.errorMsg(emsg);
    }

    const htSkip = {};
    const htRules = {};
    const htFilter = cfgParser.getHeaderTypes(msgRules);
    if(!htFilter) {
        errorMsgColor('Commit rules ', 'header.type', ' abnormal, aborting.');
    }
    htFilter.forEach(function(item, idex) {
        if(item.skip) {
            htSkip[item.name] = true;
        } else {
            htRules[item.name] = true;
        }
    });

    let hType = commit.headerObj.type;
    let hScope = commit.headerObj.scope;
    let hSubject = commit.headerObj.subject;
    let bodyMsg = commit.bodyMsg;
    let footerMsg = commit.footerMsg;

    // header:type
    if(!hType) {
        errorMsgColor('Commit message ', 'header.type', ' empty, aborting.');
    }

    if(htSkip[hType]) {
        const imsg = 'Commit message validation ignored for ';
        helper.infoMsg(imsg + colorKeys('blue', htSkip));
        return true;
    }

    if(helper.hasUpper(hType)) {
        const old = hType;
        hType = hType.toLowerCase();
        autoFixMsg('type', old, hType);
    }
    if(tools.objLength(htRules) && !htRules[hType]) {
        let emsg = "'" + hType +"' not valid types of: ";
        emsg = emsg + helper.colorKeys('green', htRules);
        helper.errorMsg(emsg);
    }

    let checkObj
    let checkResult

    // header:scope
    checkObj = cfgParser.getScopeValidateCallback(msgRules, helper);

    if(!checkObj) {
        errorMsgColor('Commit rules ', 'header.scope', ' abnormal, aborting.');
    }

    if(checkObj.isDefault) {
        // Rules: one word, can be empty, all lower case
        if(helper.hasUpper(hScope)) {
            const fixed = hScope.toLowerCase();
            autoFixMsg('scope', hScope, fixed);
            checkResult = { ok: true , autofix: fixed };
        } else {
            checkResult = { ok: true };
        }
    } else {
        checkResult = checkObj.callback(hScope);
    }

    if(!checkResult.ok) {
        errorMsgColor('', 'scope', ' invalid because ' + checkResult.emsg);
    }

    if(checkResult.autofix) {
        hasWarnings = true;
        hScope = checkResult.autofix;
    }

    // header:subject
    checkObj = cfgParser.getsubjectValidateCallback(msgRules, helper);

    if(!checkObj) {
        errorMsgColor('Commit rules ', 'header.subject', ' abnormal, aborting.');
    }

    if(checkObj.isDefault) {
        // Rules: lower-case-started, no empty, no ending with dot(.)
        if(!hSubject) {
            errorMsgColor('', 'subject', ' is empty.');
        }

        if(/\.([\s]*\n*)$/g.test(hSubject)) {
            errorMsgColor('', 'subject', ' ending with dot(.)');
        }

        if(helper.isCharUpper(hSubject.charAt(0))) {
            const fixed = helper.lowerCaseFirst(hSubject);
            autoFixMsg('subject', hSubject, fixed);
            checkResult = { ok: true , autofix: fixed };
        } else {
            checkResult = { ok: true };
        }
    } else {
        checkResult = checkObj.callback(hSubject);
    }

    if(!checkResult.ok) {
        errorMsgColor('', 'subject', ' invalid because ' + checkResult.emsg);
    }

    if(checkResult.autofix) {
        hasWarnings = true;
        hSubject = checkResult.autofix;
    }

    // body
    checkObj = cfgParser.getBodyValidateCallback(msgRules, helper);

    if(!checkObj) {
        errorMsgColor('Commit rules ', 'body', ' abnormal, aborting.');
    }

    if(checkObj.isDefault) {
        // Rules: can be anything, including empty
        checkResult = { ok: true };
    } else {
        checkResult = checkObj.callback(bodyMsg);
    }

    if(!checkResult.ok) {
        errorMsgColor('', 'body', ' invalid because ' + checkResult.emsg);
    }

    if(checkResult.autofix) {
        hasWarnings = true;
        bodyMsg = checkResult.autofix;
    }

    // footer
    checkObj = cfgParser.getFooterValidateCallback(msgRules, helper);

    if(!checkObj) {
        errorMsgColor('Commit rules ', 'footer', ' abnormal, aborting.');
    }

    if(checkObj.isDefault) {
        // default: if not empty, should be one of
        // [CLOSE] ...
        let hasClose = false;
        if(/^\[CLOSE(#\d+)*\]\s+/.test(footerMsg)) {
            hasClose = true;
        }
        // [KNOWN ISSUE] ...
        let hasKnownIssue = false;
        if(/^\[KNOWN\s+ISSUE(#\d+)*\]\s+/.test(footerMsg)) {
            hasKnownIssue = true;
        }
        // [BREAKING CHANGES] ...
        let hasBreakingChanges = false;
        if(/^\[BREAKING\s+CHANGES(#\d+)*\]\s+/.test(footerMsg)) {
            hasBreakingChanges = true;
        }

        if(!footerMsg || hasClose || hasKnownIssue || hasBreakingChanges) {
            checkResult = { ok: true };
        } else {
            const emsg = 'not one of:\n[CLOSE] ... or [CLOSE#XXX] ...\n'
                + '[KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...\n'
                + '[BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...';
            checkResult = { ok: false, emsg: emsg };
        }
    } else {
        checkResult = checkObj.callback(footerMsg);
    }

    if(!checkResult.ok) {
        errorMsgColor('', 'footer', ' invalid because ' + checkResult.emsg);
    }

    if(checkResult.autofix) {
        hasWarnings = true;
        footerMsg = checkResult.autofix;
    }

    if(commit.file && !commit.headerObj.autosquash) {
        let fixedMsg
        let sync = false;

        if(hScope) {
            fixedMsg = hType + '(' + hScope + '): ' + hSubject;
        } else {
            fixedMsg = hType + ': ' + hSubject;
        }

        if(commit.headerMsg !== fixedMsg) {
            sync = true;
        }

        if(commit.bodyMsg) {
            if(commit.bodyMsg !== bodyMsg) {
                sync = true;
                fixedMsg = fixedMsg + gitCommit.HBFSepator + bodyMsg;
            } else {
                fixedMsg = fixedMsg + gitCommit.HBFSepator + commit.bodyMsg;
            }
        }

        if(commit.footerMsg) {
            if(commit.footerMsg !== footerMsg) {
                sync = true;
                fixedMsg = fixedMsg + gitCommit.HBFSepator + footerMsg;
            } else {
                fixedMsg = fixedMsg + gitCommit.HBFSepator + commit.footerMsg;
            }
        }

        if(sync) {
            fs.writeFileSync(commit.file, fixedMsg);
        }
    }

    if(cfgParser.failOnAutoFix(msgRules, helper) && hasWarnings) {
        helper.errorMsg("Abort for fail on warnings");
        return false;
    }

    return true;
};

exports.validateMsg = validateMsg;
