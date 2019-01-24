'use strict';

// Native
const fs = require('fs');
const util = require('util');
const path = require('path');

// Packages
const myGit = require(path.join(__dirname, 'myGit'));
const config = require(path.join(__dirname, 'config'));
const myRules = require(path.join(__dirname, 'myRules'));

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
function replacer(key, value) {
    //if(!helper.cmdArgs.dev && key.match('^dev(.+)')) {
    //    return undefined; // skip tags start with 'dev' for usr
    //}

    if(typeof value == 'function') {
        // print the function text data
        return value.toString();
    } else if(key == 'type' && value instanceof Array) {
        let txt = util.format('%O', value);
        txt = txt.replace(/^\[\s/, '[\n            ');
        txt = txt.replace(/\},\n/g, '},\n          ');
        txt = txt.replace(/\}\s\]$/, '}\n        ]');
        return txt;
    } else {
        return value;
    }
}

function createExamplesJS(helper) {
    // create example commit rules, which is also the default
    const commitJS = path.join(helper.usrHome, 'commit.example.js');
    try {
        helper.tryCreate(commitJS, null, 'exports.commitRules = ');
    } catch(err) {
        helper.errorMsg("Can not create file: " + commitJS);
    }

    let bodyData = JSON.stringify(myRules.commitRules, replacer, 4);
    bodyData = bodyData.replace(/\"/g, ''); // remove "
    bodyData = bodyData.replace(/\\n/g, '\n'); // make newline

    try {
        fs.appendFileSync(commitJS, bodyData);
    } catch(err) {
        helper.errorMsg("Can not write data to: " + commitJS);
    }

    // create example semver configuration rules
    bodyData = JSON.stringify(myRules.semverRules, replacer, 4);
    bodyData = bodyData.replace(/"(\w+)"(\s*:\s*)/g, "$1$2"); // remove key's "
    bodyData = bodyData.replace(/\\n/g, '\n'); // make newline

    const semverJS = path.join(helper.usrHome, 'semver.example.js');
    try {
        fs.appendFileSync(semverJS, "exports.semverRules = " + bodyData);
    } catch(err) {
        helper.errorMsg("Can not write data to: " + semverJS);
    }
}

function initUsrHome(helper, repoPath) {
    // check if it exist & has write permission
    let projectDir = path.resolve(process.cwd(), repoPath);
    try {
        fs.accessSync(projectDir);
    } catch(err) {
        helper.errorMsg("Do not exist '" + projectDir + "'");
    }

    // check if it is a git repo
    const repoDir = myGit.getRepoDirectory(projectDir);
    if(!repoDir) {
        helper.errorMsg("Do not git repo: '" + projectDir + "'");
    }
    projectDir = repoDir;

    // check if CHANGELOG.md exist
    const changelog = path.join(projectDir, 'CHANGELOG.md');
    try {
        helper.tryCreate(changelog, () => {
            helper.warnMsg("Already exist '" + changelog + "'");
        }, '');
    } catch(err) {
        helper.errorMsg("Can not create '" + changelog + "'");
    }

    // try to create config directory
    const usrHome = config.getUsrHome(projectDir);
    try {
        helper.tryCreate(usrHome, () => {
            helper.errorMsg("Already exist '" + usrHome + "'");
        });
    } catch(err) {
        helper.errorMsg("Can not create directory '" + usrHome + "'");
    }

    helper.usrHome = usrHome;
    createExamplesJS(helper);
    process.exit(0);
}

exports.usrHome = initUsrHome;

// default commit rules
exports.attr = {
    commitRules: myRules.commitRules,
};
