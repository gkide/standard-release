'use strict';

// Native
const fs = require('fs');
const util = require('util');
const path = require('path');

// Packages
const semver = require('semver');

// Utilities
const tools = require(path.join(__dirname, 'tools'));
const myGit = require(path.join(__dirname, 'myGit'));
const config = require(path.join(__dirname, 'config'));
const mySemVer = require(path.join(__dirname, 'mySemVer'));
const myCommit = require(path.join(__dirname, 'myCommit'));
const commitRules = require(path.join(__dirname, 'commitHooks'));
const template = require(path.join(__dirname, 'template'));

function getRawFilter(helper) {
    const rawFilter = {};
    const msgRules = config.usrCommitHooks();
    const htFilter = commitRules.headerTypes(msgRules);

    if(!htFilter) {
        helper.errorMsg('Commit rules header.type abnormal, aborting.');
    }

    htFilter.forEach(function(item, idex) {
        if(!item.skip && typeof item.isFilter == 'string') {
            rawFilter[item.name] = item.isFilter;
        }
    });

    return rawFilter;
}

function arrHasVal(array, value) {
    let isFound = false;
    array.forEach(function(data) {
        if(data == value) {
            isFound = true;
        }
    });
    return isFound;
}

function gihubUrls(httpsUrl) {
    let urls = {
        commit: null,
        issues: null,
        release: null,
    };

    if(httpsUrl) {
        if(httpsUrl.slice(-4) == '.git') {
            httpsUrl = httpsUrl.slice(0, -4);
        }
        urls.commit = httpsUrl + '/commit';
        urls.issues = httpsUrl + '/issues';
        urls.compare = httpsUrl + '/compare';
        urls.release = httpsUrl + '/releases/tag';
    }

    return urls;
}

function isSHA1(tagSha1) {
    if(/^[a-fA-F0-9]+$/g.test(tagSha1)) {
        return true;
    }
    return false;
}

function runRawFilter(helper, repoUrl, startPoint, rawFilter) {
    const usrRules = { // changelog rules
        major: { group: [], keys: [] },
        minor: { group: [], keys: [] },
        patch: { group: [], keys: [] },
        tweak: { group: [], keys: [] }
    };
    const changelogRules = config.usrChangelogHooks();
    changelogRules.forEach(function(data) {
        if(data.skip) {
            return;
        }
        switch(data.semver) {
        case 'major':
            usrRules.major.group.push(data.name);
            break;
        case 'minor':
            usrRules.minor.group.push(data.name);
            break;
        case 'patch':
            usrRules.patch.group.push(data.name);
            break;
        case 'tweak':
            usrRules.tweak.group.push(data.name);
            break;
        }
    })

    const rawData = {}; // raw commit data
    for(const key in rawFilter) {
        const group = rawFilter[key]; // group name
        rawData[group] = []; // header type
        if(arrHasVal(usrRules.major.group, group)) {
            usrRules.major.keys.push(key);
        } else if(arrHasVal(usrRules.minor.group, group)) {
            usrRules.minor.keys.push(key);
        } else if(arrHasVal(usrRules.patch.group, group)) {
            usrRules.patch.keys.push(key);
        } else if(arrHasVal(usrRules.tweak.group, group)) {
            usrRules.tweak.keys.push(key);
        }
    }

    const urls = gihubUrls(repoUrl); // repo remote URLs
    const incType = { // raw increment type
        isMajor: false, isMinor: false, isPatch: false, isTweak: true
    };

    let isSkipAllRawLogs = false;
    if(helper.cmdArgs.changelogFrom) {
        if(/^skip$/i.test(helper.cmdArgs.changelogFrom)) {
            isSkipAllRawLogs = true;
        } else {
            startPoint = helper.cmdArgs.changelogFrom;
            if(!isSHA1(startPoint) && !myGit.repoHasTag(startPoint, helper)) {
                const tag = helper.colorKeys('blue', { [startPoint]: true });
                helper.errorMsg("repo has no tag named " + tag);
            }
        }
    }
    helper.debugMsg("Get Raw Logs Start From", startPoint);

    let filterOpts = {};
    if(startPoint) {
        filterOpts.from = startPoint;
    }

    myGit.getRawCommits(filterOpts).forEach(function(data, index) {
        const commitRaw = data.split('\n');
        const commitHash = commitRaw[0];
        commitRaw.shift();
        const commitMsg = commitRaw.join('\n');
        const commitData = { data:commitMsg, file:null };

        // Raw commit message
        const rawMsg = myCommit.parseCommitFromMsg(null, commitData, false);

        if(rawMsg.skip) {
            return;
        }
        const what = mySemVer.getIncrement(rawMsg, usrRules);
        if(what.skip) {
            return;
        }
        switch(what.incrementType) {
            case 'major':
                incType.isMajor = true;
                break;
            case 'minor':
                incType.isMinor = true;
                break;
            case 'patch':
                incType.isPatch = true;
                break;
            case 'tweak':
                incType.isTweak = true;
                break;
        }

        const category = rawFilter[rawMsg.headerObj.type];
        if(category) {
            let refUrl = '';
            let refName = '';
            let lineData = rawMsg.headerMsg;
            if(commitHash) {
                refName = '[' + commitHash + ']';
            }
            if(urls.commit) {
                refUrl = '(' + urls.commit + '/' + commitHash + ')';
            }
            if(refName && refUrl) {
                lineData = lineData + ' (' + refName + refUrl + ')';
            }
            lineData = lineData.replace(/\n/g, '');
            rawData[category].push(lineData);
        }
    });

    // skip all raw log message from commit history
    if(isSkipAllRawLogs) {
        for(var key in rawData){
            rawData[key].length = 0; // clean logs array
        }
    }

    return { rawData: rawData, incType: incType, repoUrl: urls };
}

function updateChangelog(helper) {
    // changelog file to update
    const changelog = config.getChangelog(helper, helper.cmdArgs.changelog);
    // latest semver tag
    const prevTag = myGit.getLatestTagSync('v');
    // repo remote url of https protocol
    const repoUrl = myGit.getGitRemoteUrlHttps();
    // raw commit message filter
    const rawFilter = getRawFilter(helper);

    const rawData = runRawFilter(helper, repoUrl, prevTag, rawFilter);

    // https://github.com/npm/node-semver, one of the following ones:
    // major, premajor, minor, preminor, patch, prepatch, or prerelease
    let incType = 'prerelease';
    if(rawData.incType.isPatch) {
        incType = 'patch';
    } else if(rawData.incType.isMinor) {
        incType = 'minor';
    } else if(rawData.incType.isMajor) {
        incType = 'major';
    }

    const nextTag = mySemVer.getReleaseTag(incType, prevTag, helper);

    const colorKeys = helper.colorKeys;
    let promptMsg = colorKeys('green', { [nextTag]: true });
    helper.infoMsg('Release Tag should be: ' + promptMsg, true);
    return template.compile(helper, nextTag, prevTag, rawData, changelog);
}

exports.update = updateChangelog;
