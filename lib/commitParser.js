'use strict';

const os = require('os');
const path = require('path');
const tools = require(path.join(__dirname, 'tools'));

const newLine = '\n';
const HBFSepator = '\n\n';

const getCommitFrom = function(msgFile) {
    if(!msgFile) {
        return null;
    }

    msgFile = path.resolve(process.cwd(), msgFile);
    let msgData = tools.getFileContent(msgFile);

    if(!msgData) {
        const gitDir = tools.getGitDir();
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

// for debug only
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

function parseCommitFromMsg(helper, commitMsg) {
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

    if(!msgHeader || typeof(msgHeader) != 'string') {
        msgHeader = null;
    }

    if(/^Merge /.test(msgHeader)) {
        return {
            file: null,
            header: msgHeader,
            headerObj: null,
            body: null,
            footer: null
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

    return {
        file: msgFile, 
        header: msgHeader,
        headerObj: headerObj,
        body: msgBody, 
        footer: msgFooter 
    };
}

function parseCommitFromCmdArgs(helper) {
    return parseCommitFromMsg(helper, getCommitMsg(helper.cmdArgs.message));
}

exports.newLine = newLine;
exports.HBFSepator = HBFSepator;
exports.parseCommitFromMsg = parseCommitFromMsg;
exports.parseCommitFromCmdArgs = parseCommitFromCmdArgs;
