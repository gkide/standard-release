'use strict';

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const devAttr = (function() {
    var devCfg = false;

    function getDev(attr) {
        if(attr == 'printCmdLineArgs') {
            if(devCfg) {
                return devCfg.printCmdLineArgs;
            } else {
                return false;
            }
        }
    }

    try {
        fs.accessSync('debug.json', fs.constants.R_OK);
    } catch (err) {
        return getDev;
    }

    devCfg = require('./debug');
    return getDev;
})();

const getModule = function(name) {
    return require(__dirname + '/lib/' + name);
}

const getGitDir = function() {
    var gitDir;
    try {
        gitDir = getModule('GitRepo').findRepoDir();
    } catch (err) { }

    return gitDir;
}

exports.standardRelease = function standardRelease() {
    // Parse cmd-line arguments
    const usrConfig = getModule('cmdparser').argv;

    if(devAttr('printCmdLineArgs')) {
        console.log(usrConfig)
    }

    const gitRepoDir = getGitDir();

    console.log("standard-release %s", chalk.green('OK'));
}
