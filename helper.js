'use strict';

// Native
const fs = require('fs');
const path = require('path');
const util = require('util');
const assert = require('assert');

// Packages
const chalk = require('chalk');

// Utilities
const tools = require(path.join(__dirname, 'lib', 'tools'));
const config = require(path.join(__dirname, 'lib', 'config'));

// helper class private attr
const helperSym = {
    cmdArgs: Symbol.for('helperCmdArgs'),
    usrHome: Symbol.for('helperUsrHome'),
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

    debugMsg(msgId, obj) {
        if(this.cmdArgs.dev) {
            console.log("============= " + msgId + " =============");
            console.log(obj);
        }
    }

    logMsg(msg) { // stdout
        if(!this.cmdArgs.silent) {
            console.log("%s: %s", chalk.blue('LOG'), msg);
        }
    }

    infoMsg(msg, noSkip) { // stdout
        if(noSkip) {
            console.info("%s", msg);
            return;
        }
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

    helper.cmdArgs = cmdArgs;
    helper.usrHome = config.getUsrHome();

    if(typeof(cmdArgs.init) != 'undefined') {
        tools.getModule('doInit').usrHome(helper, cmdArgs.init);
    }

    if(typeof(cmdArgs.message) != 'undefined') {
        if(!tools.getModule('validateMsg').validateMsg(helper)) {
            process.exit(1);
        }
    }

    if(typeof(cmdArgs.changelogTemplate) != 'undefined') {
        let changelog = 'CHANGELOG.md';
        if(cmdArgs.changelogTemplate) {
            changelog = cmdArgs.changelogTemplate;
        }
        const keyMsg = helper.colorKeys('green', { [changelog]: true });
        changelog = config.getChangelog(helper, changelog);
        if(!tools.getModule('template').insertUnrelease(changelog, helper)) {
            helper.errorMsg('Insert [Unrelease] to ' + keyMsg + ' error, exit.');
        }
    }

    if(typeof(cmdArgs.changelog) != 'undefined') {
        if(!tools.getModule('myChangelog').update(helper)) {
            helper.errorMsg('update changelog error, exit.');
        }
    }

    if(cmdArgs.release) {
        if(!tools.getModule('doRelease').doRelease(helper)) {
            helper.errorMsg('first release error, exit.');
        }
    }

    if(cmdArgs.isSemver) {
        if(!tools.getModule('mySemVer').isValidSemver(cmdArgs.isSemver)) {
            const msg = helper.colorKeys('blue', { [cmdArgs.isSemver]:true });
            helper.infoMsg('Not valid semver(https://semver.org/) => ' + msg);
            process.exit(1);
        }
    }

    //console.log("standard-release %s", chalk.green('OK'));
    process.exit(0);
}
