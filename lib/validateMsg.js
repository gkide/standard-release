'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

const tools = require(path.join(__dirname, 'tools'));
const semverRegex = require(path.join(__dirname, 'semverRegexp'));
const commitParser = require(path.join(__dirname, 'commitParser'));

var getConfig = require('./usrCfg').getConfig;

var config = getConfig();

var error = function() {
  // gitx does not display it
  // http://gitx.lighthouseapp.com/projects/17830/tickets/294-feature-display-hook-error-message-when-hook-fails
  // https://groups.google.com/group/gitx/browse_thread/thread/a03bcab60844b812
  console[config.warnOnFail ? 'warn' : 'error']('INVALID COMMIT MSG: ' + util.format.apply(null, arguments));
};

function objLength(obj) {
    const type = typeof obj;
    if(type == 'string') {
        return obj.length;
    } else if(type == 'object') {
        let cnt = 0;
        for(let i in obj) {
            cnt++;
        }
        return cnt;
    }
    return false;
}

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

function showMsgRules(msgRules) {
    console.debug('typeAny: ' + msgRules.typeAny);
    console.debug('typeIgnore: ' + msgRules.typeIgnore);
    console.debug('typeMixedCase: ' + msgRules.typeMixedCase);
    console.debug('headerMaxLength: ' + msgRules.headerMaxLength);
    msgRules.type.forEach(function(item, idex) {
        try {
                console.debug('['+item.name+']: '+item.skip+', '+item.isFilter);
        } catch(err) {
            console.debug("Config file error: 'commitRules'");
            process.exit(1);
        }
    })
    if(typeof(msgRules.scope) == 'function') {
        msgRules.scope('This is scope');
    }
    if(typeof(msgRules.subject) == 'function') {
        msgRules.subject('This is subject');
    }
    if(typeof(msgRules.body) == 'function') {
        msgRules.body('This is body');
    }
    if(typeof(msgRules.footer) == 'function') {
        msgRules.footer('This is footer');
    }
}

function validateMsg(helper) {
    const commitMsg = commitParser.getCommitMsg(helper.cmdArgs.message);
    let msgData = commitMsg.data;
    let msgFile = commitMsg.file;
    const msgRules = helper.getUsrConfig(helper.cfgSym.usrCfgCommitRules);
    // showMsgRules(msgRules);

    let hasWarnings = false;
    const autoFix = !!msgFile && msgRules.headerMsgAutoFix;
    const headerMaxLength = msgRules.headerMaxLength || 80;

    var types = config.types = config.types || 'conventional-commit-types';
    if(typeof types === 'string' && types !== '*') {
        types = Object.keys(require(types).types);
    }

    // skip lines started by #
    let msgHBF = (msgData || '').split('\n').filter(function(str) {
        return str.indexOf('#') !== 0;
    }).join('\n');

    msgHBF = msgHBF.split('\n');
    const msgHeader = msgHBF.shift();
    const msgBody = [];
    const msgFooter = [];

    const msgBF = msgHBF.reverse();
    let skipTrailEmptyLines = true;
    let footerMsgContinue = true;
    msgBF.forEach(function(item, idex) {
        console.log(idex + '[' + item + ']');
        if(item) {
            skipTrailEmptyLines = false;
        }
        if(!skipTrailEmptyLines) {
            if(footerMsgContinue) {
                if(/^\[(\w)*\]/.test(item)) {
                    msgFooter.push(item);
                } else {
                    msgBody.push(item);
                    footerMsgContinue = false;
                }
            } else {
                msgBody.push(item);
            }
        }
    });

console.log('-------------------------');
console.log('Body:');console.log(msgBody);
console.log('-------------------------');
console.log('Footer:');console.log(msgFooter);
console.log('-------------------------');

    if(msgHeader === '') {
        helper.errorMsg('Aborting commit due to empty commit message.');
        return false;
    }

    const MERGE_COMMIT = /^Merge /;
    if(MERGE_COMMIT.test(msgHeader)) {
        helper.infoMsg('Merge commit detected, skip.');
        return true;
    }

    let skipHt = '';
    let headerTypeArr = [];
    msgRules.type.forEach(function(item, idex) {
        try {
            if(item.skip) {
                if(skipHt) {
                    skipHt = skipHt + util.format('(^%s)|', item.name);
                } else {
                    skipHt = util.format('(^%s)|', item.name);
                }
            } else {
                headerTypeArr[item.name] = true;
            }
        } catch(err) {
            skipHt = '';
            helper.errorMsg("Config rules for commit header <type> abnormal.");
        }
    });

    skipHt = new RegExp(util.format('%s(^%s$)', skipHt, semverRegex().source));
    if(skipHt.test(msgHeader)) {
        helper.infoMsg('Commit message validation ignored.');
        return true;
    }

    // They are part of Git, commits tagged with them are not intended to be merged
    // fixup!  https://git-scm.com/docs/git-commit#git-commit---fixupltcommitgt
    // squash! https://git-scm.com/docs/git-commit#git-commit---squashltcommitgt
    const msgHp = /^((fixup! |squash! )?(\w+)(?:\(([^\)\s]+)\))?: (.+))(?:\n|$)/;
    const match = msgHp.exec(msgHeader);
    if(!match) {
        helper.errorMsg('Do NOT match format: "<type>(<scope>): <subject>"');
    }

    const firstLine = match[1];
    const autosquash = !!match[2];
    let type = match[3];
    let scope = match[4];
    let subject = match[5];

    // header length checking
    if(firstLine.length > headerMaxLength && !autosquash) {
        const emsg = util.format("Header is longer than %d chars", headerMaxLength);
        helper.errorMsg(emsg);
    }

    // is type mixed-case or always lower-case
    if(!msgRules.typeMixedCase) {
        type = type.toLowerCase();
    }

    // header:type checking
    if(objLength(headerTypeArr) && !headerTypeArr[type]) {
        let emsg = "'" + type +"' not valid types of: ";
        emsg = emsg + helper.colorKeys('green', headerTypeArr);
        helper.errorMsg(emsg);
    }

    // header:scope checking
    let scopeValidate = defScopeValidate;
    if(!helper.isDefautConfig()) {
        if(typeof(msgRules.scope) == 'function') {
            scopeValidate = msgRules.scope;
        } else {
            hasWarnings = true;
            helper.warnMsg("Config rules 'commitRules.scope' not function");
        }
    }

    let retArr = scopeValidate(scope, helper);
    if(!retArr[0]) {
        helper.errorMsg('<scope> invalid because ' + retArr[1]);
    }

    if(autoFix) { // auto fix subject if config
        subject = helper.lowerCaseFirst(subject);
    } else {
        if(helper.isCharUpper(subject.charAt(0))) {
            hasWarnings = true;
            helper.warnMsg("<subject> uppercase start '" + subject + "'");
        }
    }

    // header:subject checking
    let subjectValidate = defSubjectValidate;
    if(!helper.isDefautConfig()) {
        if(typeof(msgRules.subject) == 'function') {
            subjectValidate = msgRules.subject;
        } else {
            hasWarnings = true;
            helper.warnMsg("Config rules 'commitRules.subject' not function");
        }
    }

    retArr = subjectValidate(subject, helper);
    if(!retArr[0]) {
        helper.errorMsg('<subject> invalid because ' + retArr[1]);
    }

    // body checking
    let bodyValidate = defBodyValidate;
    if(!helper.isDefautConfig()) {
        if(typeof(msgRules.body) == 'function') {
            bodyValidate = msgRules.body;
        } else {
            hasWarnings = true;
            helper.warnMsg("Config rules 'commitRules.body' not function");
        }
    }

    retArr = bodyValidate(msgBody, helper);
    if(!retArr[0]) {
        helper.errorMsg('<body> invalid because ' + retArr[1]);
    }

    // footer checking
    let footerValidate = defFooterValidate;
    if(!helper.isDefautConfig()) {
        if(typeof(msgRules.footer) == 'function') {
            footerValidate = msgRules.footer;
        } else {
            hasWarnings = true;
            helper.warnMsg("Config rules 'commitRules.footer' not function");
        }
    }

    retArr = footerValidate(msgFooter, helper);
    if(!retArr[0]) {
        helper.errorMsg('<footer> invalid because ' + retArr[1]);
    }

    if(msgRules.warnOnFail && hasWarnings) {
        if(!autosquash) {
            const headerFixed = type + '(' + scope + '): ' + subject;
            if(firstLine !== headerFixed) {
                var rawFixed = msgData.replace(firstLine, headerFixed);
                fs.writeFileSync(msgFile, rawFixed);
            }
        }
        helper.warnMsg("Abort for warn on fail");
        return false;
    }

    return true;
};

exports.config = config;
exports.validateMsg = validateMsg;
