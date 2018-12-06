'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');

const chalk = require('chalk');

const fixSym = {
    rtmLog: "logs",
    cfgFile: "config.js",
    usrHome: ".standard-release",
}

const cfgSym = { // internal usr config tag
    usrCfgCommitRules: Symbol.for('usrCfgCommitRules'),
    defaultCommitRules: Symbol.for('defaultCommitRules'),
}

const helperSym = { // helper class private attr
    fixSym: Symbol.for('helperFixSym'),
    cfgSym: Symbol.for('helperCfgSym'),
    cmdArgs: Symbol.for('helperCmdArgs'),
    usrHome: Symbol.for('helperUsrHome'),
    initUsrCfg: Symbol.for('helperInitUsrCfg'),
    findUsrCfgAttr: Symbol.for('helperFindUsrCfgAttr'),
}

const helper = new class {
    colorKeys(color, arrData) {
        let objs = false;
        for(let key in arrData) {
            if(objs) {
                objs = objs + ', ' + chalk[color](key);
            } else {
                objs = chalk[color](key);
            }
        }
        return objs;
    }

    isObject(val) {
        return val && typeof(val) === 'object' && !Array.isArray(val);
    }

    isValidString(val) {
        return Boolean(typeof(val) === 'string' && val.length > 0);
    }

    hasUpper(str) {
        return /[A-Z]/.test(str);
    }

    isAllUpper(str) {
        return str === str.toUpperCase();
    }

    isCharUpper(ch) {
        return ch >= 'A' && ch <= 'Z';
    }

    hasLower(str) {
        return /[a-z]/g.test(str);
    }

    isAllLower(str) {
        return str === str.toLowerCase();
    }

    isCharLower(ch) {
        return ch >= 'a' && ch <= 'z';
    }

    upperCaseFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    lowerCaseFirst(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }

    hasNoWhiteSpace(str) {
        return /(\s*)/g.test(str);
    }

    logMsg(msg) { // stdout
        if(!this.cmdArgs.silent) {
            console.log("%s: %s", chalk.blue('LOG'), msg);
        }
    }

    infoMsg(msg) { // stdout
        if(!this.cmdArgs.silent) {
            console.info("%s: %s", chalk.green('INFO'), msg);
        }
    }

    warnMsg(msg) { // stderr
        if(!this.cmdArgs.silent) {
            console.warn("%s: %s", chalk.yellow('WARN'), msg);
        }
    }

    errorMsg(msg, exit=true) { // stderr
        console.error("%s: %s", chalk.red('ERROR'), msg);
        if(exit) {
            process.exit(1);
        }
    }

    tryCreate(fullPath, existCallback, initData, dataType=null) {
        try {
            fs.accessSync(fullPath, fs.constants.R_OK | fs.constants.W_OK);
            if(typeof(existCallback) == 'function') {
                existCallback(); // do something if already exist, if any
            }
        } catch(err) {
            if(typeof(initData) == 'undefined') {
                try {
                    fs.mkdirSync(fullPath, { recursive: true });
                } catch(err) {
                    throw new Error("Can not create directory: " + fullPath);
                }
            } else {
                if(typeof(initData) == 'string') {
                    try {
                        fs.writeFileSync(fullPath, initData); // UTF-8
                    } catch(err) {
                        throw new Error("Write UTF-8 data error: " + initData);
                    }
                } else if(typeof(dataType) == 'string' || typeof(initData) == 'object') {
                    try {
                        fs.writeFileSync(fullPath, initData, dataType);
                    } catch(err) {
                        throw new Error("Character encodings unsupported: " + dataType);
                    }
                } else {
                    throw new Error(
                        util.format("Unsupported %s data => (%s) type:\n    File: %s",
                                    typeof(initData), dataType, fullPath));
                }
            }
        }
    }

    [helperSym.findUsrCfgAttr](attr) {
        if(!this.cfgObj) {
            return false;
        }

        switch(attr) {
            case cfgSym.usrCfgCommitRules:
               try {
                    if(this.cfgObj.attr.commitRulesDefault) {
                        return getModule('cfgInit').commitRules;
                    }
                    return this.cfgObj.attr.commitRules;
                } catch(err) {
                    helper.warnMsg('Config file error, back to the default ones');
                    return getModule('cfgInit').commitRules;
                }
            case cfgSym.defaultCommitRules:
               try {
                    return this.cfgObj.attr.commitRulesDefault;
                } catch(err) {
                    return false;
                }
            default:
                return false;
        }
    }

    isDefautConfig() {
        return this.getUsrConfig(cfgSym.defaultCommitRules);
    }

    getUsrConfig(attr) {
        if(this[helperSym.initUsrCfg]) {
            return this[helperSym.findUsrCfgAttr](attr);
        }

        const cfgFile = path.join(getUsrHome(), fixSym.cfgFile);

        try {
            fs.accessSync(cfgFile, fs.constants.R_OK);
            this.cfgObj = require(cfgFile);
        } catch(err) {
            helper.warnMsg("File not exist '" + cfgFile + "'");
        }

        this[helperSym.initUsrCfg] = true;
        return this[helperSym.findUsrCfgAttr](attr);
    };


    set fixSym(value) {
        this[helperSym.fixSym] = value;
    }

    get fixSym() {
        return this[helperSym.fixSym];
    }

    set cfgSym(value) {
        this[helperSym.cfgSym] = value;
    }

    get cfgSym() {
        return this[helperSym.cfgSym];
    }

    set cmdArgs(value) {
        this[helperSym.cmdArgs] = value;
    }

    get cmdArgs() {
        return this[helperSym.cmdArgs];
    }

    set usrHome(value) {
        this[helperSym.usrHome] = value;
    }

    get usrHome() {
        return this[helperSym.usrHome];
    }
}();

const getModule = function(name) {
    return require(path.join(__dirname, 'lib', name));
}

const getGitDir = function() {
    let gitDir = null;
    try {
        gitDir = getModule('gitRepo').findRepoDir();
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

const getUsrHome = function() {
    return path.join(getProjectRootDir() || process.cwd(), fixSym.usrHome);
}

const runtimeLogs = function(cmd, msg) {
    let rtmLogFile = path.join(getUsrHome(), fixSym.rtmLog);
    try {
        fs.appendFileSync(rtmLogFile, cmd + ': ' + msg + '\n');
    } catch(err) {
        // error do nothing
    }
}

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

const getCommitFrom = function(msgFile) {
    if(!msgFile) {
        return null;
    }

    msgFile = path.resolve(process.cwd(), msgFile);
    let msgData = getFileContent(msgFile);

    if(!msgData) {
        const gitDir = getGitDir();
        if(!gitDir) {
            return null;
        }
        msgFile = path.resolve(gitDir, msgFile);
        msgData = getFileContent(msgFile);
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

const cfgInitHome = function(repoPath) {
    const prjDir = path.resolve(process.cwd(), repoPath);
    try { // check if it exist & has write permission
        fs.accessSync(prjDir);
    } catch(err) {
        helper.errorMsg("Do not exist '" + prjDir + "'");
    }

    const gitDir = path.join(prjDir, '.git');
    try { // check if it is a git repo
        fs.accessSync(gitDir);
    } catch(err) {
        helper.errorMsg("Do not find '" + gitDir + "'");
    }

    const usrHome = path.join(prjDir, fixSym.usrHome);
    try { // try to create config directory
        helper.tryCreate(usrHome, () => {
            helper.errorMsg("Already exist '" + usrHome + "'");
        });
    } catch(err) {
        helper.errorMsg("Can not create directory '" + usrHome + "'");
    }

    helper.usrHome = usrHome;
    getModule('cfgInit').usrHome(helper);
    process.exit(0);
}

exports.standardRelease = function standardRelease() {
    const cmdArgs = getModule('cmdParser').argv;
    // console.debug(cmdArgs);

    helper.fixSym = fixSym;
    helper.cfgSym = cfgSym;
    helper.cmdArgs = cmdArgs;
    helper.usrHome = getUsrHome();

    if(cmdArgs.init == '' || cmdArgs.init != '$PWD') {
        cfgInitHome(cmdArgs.init); // project repo path
    }

    if(cmdArgs.message) {
        let commitMsg = getCommitMsg(cmdArgs.message);
        const validateMsg = getModule('validateMsg').validateMsg;
        if(!validateMsg(helper, commitMsg.data, commitMsg.file)) {
            runtimeLogs('validateMsg', commitMsg.data);
            process.exit(1);
        }
    }

    console.log("standard-release %s", chalk.green('OK'));
    process.exit(0);
}
