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

function getChangelogFile(helper) {
    const repoDir = myGit.getRepoDirectory();
    if(!repoDir) {
        helper.errorMsg('Not a git repo, stop.');
    }

    let changelog = helper.cmdArgs.changelog;
    if(helper.cmdArgs.changelog == '') {
        changelog = 'CHANGELOG.md';
    }

    changelog = path.resolve(process.cwd(), changelog);

    if(!tools.hasFile(changelog)) {
        try { // create it if not exist
            helper.tryCreate(changelog, null, '');
        } catch(err) {
            helper.errorMsg("Can not create '" + changelog + "'");
        }
    }
    return changelog;
}

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
        urls.release = httpsUrl + '/releases/tag';
    }

    return urls;
}

function runRawFilter(helper, repoUrl, newVer, rawFilter) {
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

    let filterOpts = {};
    if(newVer) {
        filterOpts.from = newVer;
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

    return { rawData: rawData, incType: incType, repoUrl: urls };
}

function updateChangelog(helper) {
    // changelog file to update
    const changelog = getChangelogFile(helper);
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
