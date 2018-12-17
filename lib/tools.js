'use strict';

const fs = require('fs');
const path = require('path');

const getModule = function(name) {
    return require(path.join(__dirname, name));
}

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

const getProjectRootDir = (function() {
    return () => getModule('myGit').getRepoDirectory();
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

exports.objLength = objLength;
exports.getModule = getModule;
exports.getUsrHome = getUsrHome;
exports.runtimeLogs = runtimeLogs;
exports.getFileContent = getFileContent;
