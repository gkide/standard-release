'use strict';

// Native
const fs = require('fs');
const util = require('util');
const path = require('path');

// Utilities
const tools = require(path.join(__dirname, 'tools'));
const config = require(path.join(__dirname, 'config'));
const myCommit = require(path.join(__dirname, 'myCommit'));
const usrCommit = require(path.join(__dirname, 'commitHooks'));

function validateMsg(helper, commitMsg) {
    let commit = {};
    if(commitMsg) {
        commit = myCommit.parseCommitFromMsg(helper, commitMsg);
    } else {
        commit = myCommit.parseCommitFromCmdArgs(helper);
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
    const msgRules = config.getCommitHooks();

    if(!commit.headerMsg) {
        errorMsgColor('Aborting commit due to empty ', 'header', ' message.');
        return false;
    }

    if(/^Merge /.test(commit.headerMsg)) {
        helper.infoMsg('Merge commit detected, skip.');
        return true;
    }

    // header length checking
    const headerMaxLength = usrCommit.getHeaderMsgMaxLength(msgRules);
    if(commit.headerMsg.length > headerMaxLength && !commit.headerObj.autosquash) {
        const emsg = util.format("Header is longer than %d chars", headerMaxLength);
        helper.errorMsg(emsg);
    }

    const htSkip = {};
    const htRules = {};
    const htFilter = usrCommit.getHeaderTypes(msgRules);
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
    checkObj = usrCommit.getScopeValidateCallback(msgRules, helper);

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
    checkObj = usrCommit.getsubjectValidateCallback(msgRules, helper);

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
    checkObj = usrCommit.getBodyValidateCallback(msgRules, helper);

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
    checkObj = usrCommit.getFooterValidateCallback(msgRules, helper);

    if(!checkObj) {
        errorMsgColor('Commit rules ', 'footer', ' abnormal, aborting.');
    }

    if(checkObj.isDefault) {
        function checkFooterMsg(footerMsg) {
            if(!footerMsg) {
                return { ok: true };
            }
            let isOK = true;
            footerMsg = footerMsg.split(myCommit.newLine);
            // default: if not empty, should be one of
            footerMsg.forEach(function(data) {
                // [CLOSE] ...
                let hasClose = false;
                if(/^\[CLOSE(#\d+)*\]\s+/.test(data)) {
                    hasClose = true;
                }
                // [KNOWN ISSUE] ...
                let hasKnownIssue = false;
                if(/^\[KNOWN\s+ISSUE(#\d+)*\]\s+/.test(data)) {
                    hasKnownIssue = true;
                }
                // [BREAKING CHANGES] ...
                let hasBreakingChanges = false;
                if(/^\[BREAKING\s+CHANGES(#\d+)*\]\s+/.test(data)) {
                    hasBreakingChanges = true;
                }

                let doSkip = false;
                if(/^Signed-off-by:\s*/.test(data)) {
                    doSkip = true;
                }

                if(!hasClose && !hasKnownIssue && !hasBreakingChanges) {
                    if(!doSkip) {
                        isOK = false;
                    }
                }
            });

            if(isOK) {
                return { ok: true };
            } else {
                const emsg = 'not one of:\n[CLOSE] ... or [CLOSE#XXX] ...\n'
                    + '[KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...\n'
                    + '[BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...';
                return { ok: false, emsg: emsg };
            }
        }

        if(footerMsg) {
            let msgArray = footerMsg.split(myCommit.newLine);
            msgArray = msgArray.filter(function(data) {
                if(/^\s*$/.test(data) || !data) {
                    return false;
                } else {
                    return true;
                }
            });
            footerMsg = msgArray.join(myCommit.newLine);
        }

        checkResult = checkFooterMsg(footerMsg);
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
                fixedMsg = fixedMsg + myCommit.HBFSepator + bodyMsg;
            } else {
                fixedMsg = fixedMsg + myCommit.HBFSepator + commit.bodyMsg;
            }
        }

        if(commit.footerMsg) {
            if(commit.footerMsg !== footerMsg) {
                sync = true;
                fixedMsg = fixedMsg + myCommit.HBFSepator + footerMsg;
            } else {
                fixedMsg = fixedMsg + myCommit.HBFSepator + commit.footerMsg;
            }
        }

        if(sync) {
            fs.writeFileSync(commit.file, fixedMsg);
        }
    }

    if(usrCommit.failOnAutoFix(msgRules, helper) && hasWarnings) {
        helper.errorMsg("Abort for fail on warnings");
        return false;
    }

    return true;
};

exports.validateMsg = validateMsg;
