'use strict';

const fs = require('fs');
const findup = require('findup');
const resolve = require('path').resolve;

function getConfig() {
    function getUsrCfgObj(fname) {
        try {
            const cfgFile = findup.sync(process.cwd(), fname);
            return JSON.parse(fs.readFileSync(resolve(cfgFile, fname)));
        } catch(e) {
            return null;
        }
    }

    function getPackageConfig() {
        const cfgObj = getUsrCfgObj('package.json');
        return cfgObj && cfgObj.config && cfgObj.config['validate-commit-msg'];
    }

    return getPackageConfig() || {};
}

exports.getConfig = getConfig;

