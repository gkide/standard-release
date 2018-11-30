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

exports.standardRelease = function standardRelease() {
    // Parse cmd-line arguments
    const usrConfig = require('./lib/cmdparser').argv;
    
    if(devAttr('printCmdLineArgs')) {
        console.log(usrConfig)
    }

    console.log("standard-release %s", chalk.green('OK'));
}
