'use strict';

const fs = require('fs');
const path = require('path');

const bufferToString = function(buffer) {
    let hasToString = buffer && typeof(buffer.toString) === 'function';
    return hasToString && buffer.toString();
}

const getFileContent = function(filePath) {
    try {
        let buffer = fs.readFileSync(filePath);
        return bufferToString(buffer);
    } catch(err) {
        // Ignore these error types because it is most likely 
        // validating a commit from a text instead of a file
        if(err && err.code !== 'ENOENT' && err.code !== 'ENAMETOOLONG') {
            throw err;
        }
    }
}

const getGitDir = function() {
    let gitDir = null;
    try {
        gitDir = tools.getModule('gitRepo').findRepoDir();
    } catch(err) {
        // do nothing
    }

    return gitDir;
}

const getProjectRootDir = (function() {
    let projectRootDir
    const gitDir = getGitDir();
    if(gitDir) {
        projectRootDir = gitDir.substr(0, gitDir.length-5);
    }

    return () => projectRootDir;
})();

const getUsrHome = function(usrHome) {
    return path.join(getProjectRootDir() || process.cwd(), usrHome);
}

const runtimeLogs = function(cmd, msg, usrHome, logFileName) {
    let rtmLogFile = path.join(getUsrHome(usrHome), logFileName);
    try {
        fs.appendFileSync(rtmLogFile, cmd + ': ' + msg + '\n');
    } catch(err) {
        // error do nothing
    }
}

const getModule = function(name) {
    return require(path.join(__dirname, name));
}

exports.getGitDir = getGitDir;
exports.getModule = getModule;
exports.getUsrHome = getUsrHome;
exports.runtimeLogs = runtimeLogs;
exports.getFileContent = getFileContent;
