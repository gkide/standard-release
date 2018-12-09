'use strict';

const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');

const chalk = require('chalk');

const tools = require(path.join(__dirname, 'lib', 'tools'));

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
    colorKeys(color, obj) {
        let objs = false;
        for(let key in obj) {
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

    runtimeLogs(cmd, msg) {
        tools.runtimeLogs(cmd, msg, fixSym.usrHome, fixSym.rtmLog);
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
        const defCfgObj = tools.getModule('cfgInit');
        if(!this.cfgObj) {
            this.warnMsg('Config file missing, back to the default ones');
            this.cfgObj = defCfgObj;
        }

        switch(attr) {
            case cfgSym.usrCfgCommitRules:
               try {
                    if(this.getUsrConfig(cfgSym.defaultCommitRules)) {
                        return defCfgObj.attr.commitRules;;
                    }
                    return this.cfgObj.attr.commitRules;
                } catch(err) {
                    return {};
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

        const cfgFile = path.join(tools.getUsrHome(fixSym.usrHome), fixSym.cfgFile);

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

exports.standardRelease = function standardRelease() {
    const cmdArgs = tools.getModule('cmdParser').argv;
    // console.debug(cmdArgs);

    helper.fixSym = fixSym;
    helper.cfgSym = cfgSym;
    helper.cmdArgs = cmdArgs;
    helper.usrHome = tools.getUsrHome(fixSym.usrHome);

    if(cmdArgs.init == '' || cmdArgs.init != '$PWD') {
        tools.getModule('cfgInit').initUsrHome(helper, cmdArgs.init);
    }

    if(typeof(cmdArgs.message) != 'undefined') {
        if(!tools.getModule('validateMsg').validateMsg(helper)) {
            process.exit(1);
        }
    }

    if(cmdArgs.changelog == '' || cmdArgs.changelog != 'CHANGELOG.md') {
        if(cmdArgs.changelog == '') { // default
            cmdArgs.changelog = 'CHANGELOG.md';
        }
        if(!tools.getModule('updateChangelog').updateChangelog(helper)) {
            helper.errorMsg('update changelog error, exit.');
        }
    }

    if(cmdArgs.first) {
        if(!tools.getModule('first').doFirstRelease(helper)) {
            helper.errorMsg('first release error, exit.');
        }
    }

    //console.log("standard-release %s", chalk.green('OK'));
    process.exit(0);
}
