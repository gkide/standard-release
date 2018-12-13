'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');
const semver = require('semver');

const tools = require(path.join(__dirname, 'tools'));
const myGit = require(path.join(__dirname, 'myGit'));
const mySemVer = require(path.join(__dirname, 'mySemVer'));
const cfgParser = require(path.join(__dirname, 'cfgParser'));
const commitParser = require(path.join(__dirname, 'commitParser'));

function updateChangelog(helper) {
    const changelogFile = path.resolve(process.cwd(), helper.cmdArgs.changelog);
    try {
        fs.accessSync(changelogFile);
    } catch(err) {
        helper.errorMsg("Do not exist '" + changelogFile + "'");
    }

    let projectSemver = false;
    try {
        const semverFile = path.join(helper.usrHome, 'semver.js');
        fs.accessSync(semverFile);
        projectSemver = require(semverFile).semver;
    } catch(err) {
        // skip it
    }

    if(projectSemver) {
        const nextSemver = 'v' + projectSemver.major
                            + '.' + projectSemver.minor
                            + '.' + projectSemver.patch
                            + '-' + projectSemver.preRelease
                            + '+' + projectSemver.buildNumber;
        if(!semver.valid(nextSemver)) {
            helper.errorMsg('Project semantic version invalid: ' + nextSemver);
        }
        projectSemver = nextSemver;
    }

    const htRules = {};
    let hasBreaking = false;
    const msgRules = helper.getUsrConfig(helper.cfgSym.usrCfgCommitRules);
    const htFilter = cfgParser.getHeaderTypes(msgRules);
    if(!htFilter) {
        errorMsgColor('Commit rules ', 'header.type', ' abnormal, aborting.');
    }
    htFilter.forEach(function(item, idex) {
        if(item.isFilter) {
            htRules[item.name] = item.category;
            if(item.name == 'break'
               || item.name == 'breaking'
               || item.name == 'major') {
                hasBreaking = true;
            }
        }
    });

    const latestTag = myGit.getLatestTagSync('v');
    const latestVersion = semver.clean(latestTag).split('.');
    const latestMajor = latestVersion[0];
    const latestMinor = latestVersion[1];
    const latestPatch = latestVersion[2];

    let gitOpts = {};
    if(latestTag) {
        gitOpts.to = latestTag;
    }

    const changelogBody = {};
    Object.values(htRules).forEach(function(item) {
        changelogBody[item] = [];
    });
    if(!hasBreaking) {
        changelogBody['BreakingChanges'] = [];
    }

    const incrementInfo = {
        isMajor: false,
        isMinor: false,
        isPatch: false,
        isBreaking: false
    };
    myGit.getRawCommits(gitOpts).forEach(function(data, index) {
        const commitMsg = { data:data, file:null };
        const commitObj = commitParser.parseCommitFromMsg(null, commitMsg, false);
        if(commitObj.skip) {
            return;
        }
        const obj = mySemVer.getIncrement(commitObj);
        if(obj.skip) {
            return;
        }
        switch(obj.incrementType) {
            case 'major':
                incrementInfo.isMajor = true;
                break;
            case 'minor':
                incrementInfo.isMinor = true;
                break;
            case 'patch':
                incrementInfo.isPatch = true;
                break;
        }
        if(obj.isBreaking) {
            incrementInfo.isBreaking = true;
        }

        const category = htRules[commitObj.headerObj.type];
        if(category) {
            changelogBody[category].push(commitObj.headerMsg);
        }

        if(!hasBreaking && obj.isBreaking) {
            changelogBody['BreakingChanges'].push(commitObj.headerMsg);
        }
    });
console.log(incrementInfo);
console.log(changelogBody);
    return false;
}

exports.updateChangelog = updateChangelog;
