'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');

const chalk = require('chalk');

const fixSym = {
    envCfg: "STANDARD_RELEASE_CONFIG_FILE",
    rtmLog: "logs",
    cfgFile: "config.js",
    usrHome: ".standard-release",
}

const cfgSym = { // internal usr config tag
    devPrintCmdArgs: Symbol.for('devPrintCmdArgs'),
    devPrintCommitRules: Symbol.for('devPrintCommitRules'),
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
    logMsg(msg, skip=false) { // stdout
        if(!skip) {
            console.log("%s: %s", chalk.blue('LOG'), msg);
        }
    }

    infoMsg(msg, skip=false) { // stdout
        if(!skip) {
            console.info("%s: %s", chalk.green('INFO'), msg);
        }
    }

    warnMsg(msg, skip=false) { // stderr
        if(!skip) {
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
            // developer debug attrs
            case cfgSym.devPrintCmdArgs:
                try {
                    return this.cfgObj.attr.devPrintCmdArgs;
                } catch(err) {
                    return false;
                }
            case cfgSym.devPrintCommitRules:
               try {
                    return this.cfgObj.attr.devPrintCommitRules;
                } catch(err) {
                    return false;
                }
            // usr configuration data
            case cfgSym.usrCfgCommitRules:
               try {
                    if(this.cfgObj.attr.commitRulesDefault) {
                        return getModule('cfgInit').commitRules;
                    }
                    return this.cfgObj.attr.commitRules;
                } catch(err) {
                    const wmsg = 'Config file error, back to the default ones';
                    helper.warnMsg(wmsg, helper.cmdArgs.silent);
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

    getUsrConfig(attr) {
        if(this[helperSym.initUsrCfg]) {
            return this[helperSym.findUsrCfgAttr](attr);
        }

        let cfgFile
        const defVal = path.join('$PWD', '.standard-release', 'config.js');
        if(this.cmdArgs.configFile != defVal) { // cmd line first if not default
            cfgFile = this.cmdArgs.configFile;
        } else {
            cfgFile = process.env[fixSym.envCfg] // env is set?
                      || path.join(getUsrHome(), fixSym.cfgFile);
        }

        try {
            fs.accessSync(cfgFile, fs.constants.R_OK);
            this.cfgObj = require(cfgFile);
        } catch(err) {
            const wmsg = "'" + cfgFile + "' not exist or '$" + fixSym.envCfg + "' invalid"
            helper.warnMsg(wmsg, helper.cmdArgs.silent);
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
    let gitDir;
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
    fs.appendFileSync(rtmLogFile, cmd + ': ' + msg + '\n');
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
    const gitDir = getGitDir();
    if(!gitDir || !msgFile) {
        return null;
    }

    msgFile = path.resolve(gitDir, msgFile);
    let msgData = getFileContent(msgFile);
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
    // Parse cmd-line arguments
    const cmdArgs = getModule('cmdParser').argv;

    helper.fixSym = fixSym;
    helper.cfgSym = cfgSym;
    helper.cmdArgs = cmdArgs;
    helper.usrHome = getUsrHome();

    if(cmdArgs.init == '' || cmdArgs.init != '$PWD') {
        cfgInitHome(cmdArgs.init); // project repo path
    }

    if(helper.getUsrConfig(cfgSym.devPrintCmdArgs)) {
        console.debug(cmdArgs);
    }

    if(helper.getUsrConfig(cfgSym.devPrintCommitRules)) {
        console.debug(helper.getUsrConfig(cfgSym.usrCfgCommitRules));
    }

    console.debug(helper.getUsrConfig(cfgSym.defaultCommitRules));

    if(cmdArgs.validate) {
        let commitMsg = getCommitMsg(cmdArgs.validate);
        const validateMsg = getModule('validateMsg').validateMsg;
        if(!validateMsg(helper, commitMsg.data, commitMsg.file)) {
            runtimeLogs('validateMsg', commitMsg.data);
            process.exit(1);
        }
        process.exit(0);
    }

    console.log("standard-release %s", chalk.green('OK'));
}
