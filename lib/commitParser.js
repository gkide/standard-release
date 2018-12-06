'use strict';

const path = require('path');
const tools = require(path.join(__dirname, 'tools'));

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

exports.getCommitMsg = getCommitMsg;
