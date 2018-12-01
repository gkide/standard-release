'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const getModule = function(name) {
    return require(__dirname + '/lib/' + name);
}

const getGitDir = function() {
    let gitDir;
    try {
        gitDir = getModule('GitRepo').findRepoDir();
    } catch (err) { }

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

const getConfigDir = function() {
    return (getProjectRootDir() || process.cwd()) + '/.standard-release';
}

const runtimeLogs = function(msg) {
    let errLogFile = getConfigDir() + '/logs';
    console.log(errLogFile);
    fs.appendFileSync(errLogFile, msg + '\n');
}

const getConfigAttr = (function() {
    let config = false; // config file is missing ?
    let cfgFile = getConfigDir() + '/config.js';

    function findConfigAttr(attr) {
        // developer debug attrs
        if(attr == 'devPrintCmdLineArgs') {
            if(config) {
                return config.attr.devPrintCmdLineArgs;
            } else {
                return false;
            }
        }
    }

    try {
        fs.accessSync(cfgFile, fs.constants.R_OK);
    } catch (err) {
        return findConfigAttr;
    }

    config = require(cfgFile);
    return findConfigAttr;
})();

const bufferToString = function(buffer) {
    let hasToString = buffer && typeof buffer.toString === 'function';
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

const getCommitFrom = function(file) {
    const gitDir = getGitDir();
    if(!gitDir || !file) {
        return null;
    }

    file = path.resolve(gitDir, file);
    let message = getFileContent(file);
    return (!message) ? null : {
        message: message,
        sourceFile: file
    };
}

const getCommitInfo = function(msgFileOrText) {
    if(msgFileOrText !== undefined) {
        return getCommitFrom(msgFileOrText) || { message: msgFileOrText };
    }
    return getCommitFrom('COMMIT_EDITMSG') || { message: null };
}

exports.standardRelease = function standardRelease() {
    // Parse cmd-line arguments
    const cmdArgs = getModule('cmdParser').argv;

    if(getConfigAttr('devPrintCmdLineArgs')) {
        console.log(cmdArgs);
    }

    if(cmdArgs.validate) {
        let commitInfo = getCommitInfo(cmdArgs.validate);
        const validateMsg = getModule('validateMsg').validateMsg;
        if(!validateMsg(commitInfo.message, commitInfo.sourceFile)) {
            runtimeLogs(commitInfo.message);
            process.exit(1);
        }
        process.exit(0);
    }

    console.log("standard-release %s", chalk.green('OK'));
}
