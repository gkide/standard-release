'use strict';

// Native
const os = require('os');
const path = require('path');

// Utilities
const tools = require(path.join(__dirname, 'tools.js'));
const myGit = require(path.join(__dirname, 'myGit.js'));

const newLine = '\n';
const HBFSepator = '\n\n';

const getCommitFrom = function(msgFile) {
    if(!msgFile) {
        return null;
    }

    msgFile = path.resolve(process.cwd(), msgFile);
    let msgData = tools.getFileContent(msgFile);

    if(!msgData) {
        const gitDir = myGit.getGitDir();
        if(!gitDir) {
            return null;
        }
        msgFile = path.resolve(gitDir, msgFile);
        msgData = tools.getFileContent(msgFile);
    }

    return (!msgData) ? null : { data: msgData, file: msgFile };
}

const getCommitMsg = function(msgFileOrText) {
    const defMsg = { data: msgFileOrText, file: null  };
    if(msgFileOrText !== undefined) {
        return getCommitFrom(msgFileOrText) || defMsg;
    }
    return getCommitFrom('COMMIT_EDITMSG') || defMsg;
}

function ignoreCommentsLine(msgData) {
    if(!msgData) {
        return '';
    }
    let msgArray = msgData.split(newLine);
    // skip lines started by #
    msgArray = msgArray.filter(function(str) {
        if(/^#.*/.test(str)) {
            return false;
        } else {
            return true;
        }
    });
    return msgArray.join(newLine);
}

function parseCommitFromMsg(helper, commitMsg, errOnFail=true) {
    const msgData = commitMsg.data;
    const msgFile = commitMsg.file;

    // header, body, footer
    let msgHBF = (msgData || '').split(HBFSepator);

    // skip lines started by #
    msgHBF = msgHBF.filter(function(str) {
        if(/^#.*/.test(str)) {
            return false;
        } else {
            return true;
        }
    });

    let msgHeader = msgHBF.shift();
    msgHBF.reverse();

    while(!msgHBF[0] || msgHBF[0] == '\n' || msgHBF[0] == '\r\n') {
        if(!msgHBF.length) {
            break;
        }
        msgHBF.shift();
    };

    let msgFooter = msgHBF.shift();
    msgHBF.reverse();
    let msgBody = msgHBF;

    if(!tools.objLength(msgBody) && tools.objLength(msgFooter)) {
        msgBody = msgFooter;
        msgFooter = '';
    }

    if(msgBody instanceof Array) {
        msgBody = msgBody.join(HBFSepator);
    }
    if(!msgBody || typeof(msgBody) != 'string') {
        msgBody = null;
    }

    if(msgFooter instanceof Array) {
        msgFooter = msgFooter.join(HBFSepator);
    }
    if(!msgFooter || typeof(msgFooter) != 'string') {
        msgFooter = null;
    }

    msgHeader = ignoreCommentsLine(msgHeader);
    msgBody = ignoreCommentsLine(msgBody);
    msgFooter = ignoreCommentsLine(msgFooter);

    if(!msgHeader || typeof(msgHeader) != 'string') {
        msgHeader = null;
    }

    if(/^Merge /.test(msgHeader)) {
        return {
            file: null,
            headerMsg: msgHeader,
            headerObj: null,
            bodyMsg: null,
            footerMsg: null
        };
    }

    let headerObj = {};
    if(msgHeader) {
        // They are part of Git, commits tagged with them are not intended to be merged
        // fixup!  https://git-scm.com/docs/git-commit#git-commit---fixupltcommitgt
        // squash! https://git-scm.com/docs/git-commit#git-commit---squashltcommitgt
        const msgHp = /^((fixup! |squash! )?(\w+)(?:\(([^\)\s]+)\))?: {1}(.+))(?:\n|$)/;
        const match = msgHp.exec(msgHeader);
        if(!match) {
            if(!errOnFail) {
                return { skip:true };
            }
            helper.infoMsg(msgHeader);
            let emsg = 'Do NOT match format: "<';
            emsg = emsg + helper.colorKeys('green',  { type: true }) + '>(<';
            emsg = emsg + helper.colorKeys('yellow', { scope: true }) + '>): <';
            emsg = emsg + helper.colorKeys('cyan',   { subject: true }) + '>"';
            helper.errorMsg(emsg);
        }

        const autosquash = !!match[2];
        const type = match[3];
        const scope = match[4];
        const subject = match[5];
        headerObj = {
            type: type,
            scope: scope,
            subject: subject,
            autosquash: autosquash
       };
    }

    return {
        file: msgFile,
        headerMsg: msgHeader,
        headerObj: headerObj,
        bodyMsg: msgBody,
        footerMsg: msgFooter
    };
}

function parseCommitFromCmdArgs(helper) {
    return parseCommitFromMsg(helper, getCommitMsg(helper.cmdArgs.message));
}

exports.newLine = newLine;
exports.HBFSepator = HBFSepator;
exports.parseCommitFromMsg = parseCommitFromMsg;
exports.parseCommitFromCmdArgs = parseCommitFromCmdArgs;
