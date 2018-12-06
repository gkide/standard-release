'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

const tools = require(path.join(__dirname, 'tools'));
const semverRegex = require(path.join(__dirname, 'semverRegexp'));
const gitCommit = require(path.join(__dirname, 'commitParser'));

// Rules: one word, can be empty, all lower case
function defScopeValidate(scope, helper) {
    if(!scope) {
        return [true, 'ok'];
    }

    if(helper.hasUpper(scope)) {
        return [false, "has upper case '" + scope + "'"];
    }

    return [true, 'ok'];
}

// Rules: lower-case-started, no empty, no ending with dot(.)
function defSubjectValidate(subject, helper) {
    if(!subject) {
        return [false, 'subject is empty'];
    }

    if(/\.([\s]*\n*)$/g.test(subject)) {
        return [false, 'ending with dot(.)'];
    }

    return [true, 'ok'];
}

// Rules: can be anything, including empty
function defBodyValidate(body, helper) {
    return [true, 'ok'];
}

// default: [CLOSE#XXX]: ... OR [ISSUE#XXX]: ... if not empty
function defFooterValidate(footer, helper) {
    return [true, 'ok'];
}

function validateMsg(helper, commitMsg) {
    let commitObj = {};
    if(commitMsg) {
        commitObj = gitCommit.parseCommitFromMsg(helper, commitMsg);
    } else {
        commitObj = gitCommit.parseCommitFromCmdArgs(helper);
    }

    let msgFile = commitObj.file;
    let type = commitObj.headerObj ? commitObj.headerObj.type : null;
    let scope = commitObj.headerObj ? commitObj.headerObj.scope : null;
    let subject = commitObj.headerObj ? commitObj.headerObj.subject : null;

    let hasWarnings = false;
    const msgRules = helper.getUsrConfig(helper.cfgSym.usrCfgCommitRules);
    const autoFix = !!msgFile && msgRules.headerMsgAutoFix;
    const headerMaxLength = msgRules.headerMaxLength || 80;

    function autoFixMsg(type, oldVal, newVal) {
        let imsg = 'Autofix <' + helper.colorKeys('blue', { [type]: true }) + '>';
        imsg = imsg + ': ' + helper.colorKeys('yellow', { [oldVal]: true }) + ' => ';
        helper.infoMsg(imsg + helper.colorKeys('green', { [newVal]: true }));
    }

    function errorMsgColor(perfixMsg, key, suffixMsg) {
        const keyMsg = '<' + helper.colorKeys('blue', { [key]: true }) + '>';
        helper.errorMsg(perfixMsg + keyMsg + suffixMsg);
    }

    function warnMsgColor(perfixMsg, key, suffixMsg) {
        const keyMsg = '<' + helper.colorKeys('yellow', { [key]: true }) + '>';
        helper.warnMsg(perfixMsg + keyMsg + suffixMsg);
    }

    const colorKeys = helper.colorKeys;

    if(!commitObj.header) {
        errorMsgColor('Aborting commit due to empty ', 'header', ' message.');
        return false;
    }

    if(/^Merge /.test(commitObj.header)) {
        helper.infoMsg('Merge commit detected, skip.');
        return true;
    }

    let skipHt = '';
    let htObj = {};
    let htSkip = {};
    msgRules.type.forEach(function(item, idex) {
        try {
            if(item.skip) {
                if(skipHt) {
                    skipHt = skipHt + util.format('(^%s)|', item.name);
                } else {
                    skipHt = util.format('(^%s)|', item.name);
                }
                htSkip[item.name] = true;
            } else {
                htObj[item.name] = true;
            }
        } catch(err) {
            errorMsgColor('Config rules for commit header ', 'type', ' abnormal.');
        }
    });

    skipHt = new RegExp(util.format('%s(^%s$)', skipHt, semverRegex().source));
    if(skipHt.test(commitObj.header)) {
        const imsg = 'Commit message validation ignored for ';
        helper.infoMsg(imsg + colorKeys('blue', htSkip));
        return true;
    }

    // header length checking
    if(commitObj.header.length > headerMaxLength && !commitObj.headerObj.autosquash) {
        const emsg = util.format("Header is longer than %d chars", headerMaxLength);
        helper.errorMsg(emsg);
    }

    // header:type mixed-case or always lower-case
    if(!msgRules.typeMixedCase && helper.hasUpper(type)) {
        const old = type;
        type = type.toLowerCase();
        autoFixMsg('type', old, type);
    }

    // header:type checking
    if(tools.objLength(htObj) && !htObj[type]) {
        let emsg = "'" + type +"' not valid types of: ";
        emsg = emsg + helper.colorKeys('green', htObj);
        helper.errorMsg(emsg);
    }

    if(autoFix && helper.hasUpper(scope)) {
        const old = scope;
        scope = scope.toLowerCase();
        autoFixMsg('scope', old, scope);
    }

    // header:scope checking
    let scopeValidate = defScopeValidate;
    if(!helper.isDefautConfig()) {
        if(typeof(msgRules.scope) == 'function') {
            scopeValidate = msgRules.scope;
        } else {
            hasWarnings = true;
            warnMsgColor('Config rules ', 'commitRules.scope', ' not a function');
        }
    }

    let retArr = scopeValidate(scope, helper);
    if(!retArr[0]) {
        errorMsgColor('', 'scope', ' invalid because ' + retArr[1]);
    }

    if(autoFix && helper.isCharUpper(subject.charAt(0))) {
        const old = subject;
        subject = helper.lowerCaseFirst(subject);
        autoFixMsg('subject', old, subject);
    }

    // header:subject checking
    let subjectValidate = defSubjectValidate;
    if(!helper.isDefautConfig()) {
        if(typeof(msgRules.subject) == 'function') {
            subjectValidate = msgRules.subject;
        } else {
            hasWarnings = true;
            warnMsgColor('Config rules ', 'commitRules.subject', ' not a function');
        }
    }

    retArr = subjectValidate(subject, helper);
    if(!retArr[0]) {
        errorMsgColor('', 'subject', ' invalid because ' + retArr[1]);
    }

    // body checking
    let bodyValidate = defBodyValidate;
    if(!helper.isDefautConfig()) {
        if(typeof(msgRules.body) == 'function') {
            bodyValidate = msgRules.body;
        } else {
            hasWarnings = true;
            warnMsgColor('Config rules ', 'commitRules.body', ' not a function');
        }
    }

    retArr = bodyValidate(commitObj.body, helper);
    if(!retArr[0]) {
        errorMsgColor('', 'body', ' invalid because ' + retArr[1]);
    }

    // footer checking
    let footerValidate = defFooterValidate;
    if(!helper.isDefautConfig()) {
        if(typeof(msgRules.footer) == 'function') {
            footerValidate = msgRules.footer;
        } else {
            hasWarnings = true;
            warnMsgColor('Config rules ', 'commitRules.footer', ' not a function');
        }
    }

    retArr = footerValidate(commitObj.footer, helper);
    if(!retArr[0]) {
        errorMsgColor('', 'footer', ' invalid because ' + retArr[1]);
    }

    if(msgRules.warnOnFail && hasWarnings) {
        helper.warnMsg("Abort for warn on fail");
        return false;
    }

    if(msgFile && !commitObj.headerObj.autosquash) {
        let headerFixed
        if(scope) {
            headerFixed = type + '(' + scope + '): ' + subject;
        } else {
            headerFixed = type + ': ' + subject;
        }

        if(commitObj.header !== headerFixed) {
            const rawFixed = headerFixed + gitCommit.HBFSepator
                             + commitObj.body + gitCommit.HBFSepator
                             + commitObj.footer;
            fs.writeFileSync(msgFile, rawFixed);
        }
    }

    return true;
};

exports.validateMsg = validateMsg;
