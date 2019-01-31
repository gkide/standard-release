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
const template = require(path.join(__dirname, 'changelog', 'template'));

function getChangelogFile(helper) {
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

function updateChangelog(helper) {
    const repoDir = myGit.getRepoDirectory();
    if(!repoDir) {
        helper.errorMsg('Not a git repo, stop.');
    }

    // changelog file to update
    const changelog = getChangelogFile(helper);
    // latest semver tag
    const prevTag = myGit.getLatestTagSync('v');
    // repo remote url of https protocol
    const repoUrl = myGit.getGitRemoteUrlHttps();

    return template.compile(helper, repoUrl, "v0.2.0", prevTag, changelog);

//////////////////////////////////////////////////////
    const htRules = {};
    const msgRules = config.getCommitHooks();
    const htFilter = commitRules.headerTypes(msgRules);
    if(!htFilter) {
        errorMsgColor('Commit rules ', 'header.type', ' abnormal, aborting.');
    }
    htFilter.forEach(function(item, idex) {
        if(item.isFilter) {
            htRules[item.name] = item.isFilter;
        }
    });

    const latestTag = myGit.getLatestTagSync('v');

    let gitOpts = {};
    if(latestTag) {
        gitOpts.from = latestTag;
    }

    const changelogBodyObj = {};
    Object.values(htRules).forEach(function(item) {
        changelogBodyObj[item] = [];
    });

    const incInfo = {
        isMajor: false,
        isMinor: false,
        isPatch: false
    };
    myGit.getRawCommits(gitOpts).forEach(function(data, index) {
        const commitRaw = data.split('\n');
        const commitHash = commitRaw[0];
        commitRaw.shift();
        const commitMsg = commitRaw.join('\n');
        const commitData = { data:commitMsg, file:null };
        const commitObj = myCommit.parseCommitFromMsg(null, commitData, false);
        if(commitObj.skip) {
            return;
        }
        const obj = mySemVer.getIncrement(commitObj);
        if(obj.skip) {
            return;
        }
        switch(obj.incrementType) {
            case 'major':
                incInfo.isMajor = true;
                break;
            case 'minor':
                incInfo.isMinor = true;
                break;
            case 'patch':
                incInfo.isPatch = true;
                break;
        }

        const category = htRules[commitObj.headerObj.type];
        if(category) {
            let refUrl = '';
            let refName = '';
            let lineData = commitObj.headerMsg;
            if(commitHash) {
                refName = '[' + commitHash + ']';
            }
            if(commitUrl) {
                refUrl = '(' + commitUrl + '/' + commitHash + ')';
            }
            if(refName || refUrl) {
                lineData = lineData + ' (' + refName + refUrl + ')';
            }
            lineData = lineData.replace(/\n/g, '');
            changelogBodyObj[category].push(lineData);
        }
    });

    // https://github.com/npm/node-semver, one of the following ones:
    // major, premajor, minor, preminor, patch, prepatch, or prerelease
    let incType = 'prerelease';
    if(incInfo.isPatch) {
        incType = 'patch';
    }
    if(incInfo.isMinor) {
        incType = 'minor';
    }
    if(incInfo.isMajor) {
        incType = 'major';
    }

    let configSemver = false;
    try {
        const semverFile = path.join(helper.usrHome, 'semver.js');
        fs.accessSync(semverFile);
        configSemver = require(semverFile).semver;
    } catch(err) {
        // skip it
    }
    const releaseTag = mySemVer.getReleaseTag(incType, latestTag, configSemver, helper);
    const changelogHeader = [
        '# Change Log',
        '',
        '- ALL NOTABLE CHANGES WILL BE DOCUMENTED HERE.',
        '- PROJECT VERSIONS ADHERE TO [SEMANTIC VERSIONING](http://semver.org).',
        '- REPOSITORY COMMITS ADHERE TO [CONVENTIONAL COMMITS](https://conventionalcommits.org).',
    ];

    let releaseHeader = '## Release ' + releaseTag;
    if(releaseTagUrl) {
        const rtName = '[' + releaseTag + ']';
        const rtUrl = '(' + releaseTagUrl + '/' + releaseTag + ')';
        releaseHeader = '## Release ' + rtName + rtUrl;
    }

    // The changelog in reverse order
    let changelogBodyMsg = changelogHeader.join('\n') + '\n\n' + releaseHeader;
    Object.keys(changelogBodyObj).forEach(function(data) {
        const msgArray = changelogBodyObj[data];
        const msgNum = tools.objLength(msgArray);
        if(msgNum) {
            changelogBodyMsg += '\n\n' + '### ' + data + '\n';
            msgArray.forEach(function(line, index) {
                if(index +1 == msgNum) {
                    changelogBodyMsg += '- ' + line;
                } else {
                    changelogBodyMsg += '- ' + line + '\n';
                }
            });
        }
    });

    try {
        helper.tryCreate(changelogSwap, null, changelogBodyMsg);
    } catch(err) {
        helper.errorMsg('Can not write temp changlog file: ' + changelogSwap);
    }

    let oldData = fs.readFileSync(changelog, { encoding: 'utf8' });
    oldData = oldData.split('\n\n');
    oldData.shift(); // skip the header
    oldData = oldData.join('\n\n');

    if(oldData) {
        fs.appendFileSync(changelogSwap, '\n\n' + oldData, 'utf8');
    }

    fs.unlinkSync(changelog);
    fs.renameSync(changelogSwap, changelog)

    const colorKeys = helper.colorKeys;
    let promptMsg = 'Release Tag should be: ' + colorKeys('green', { [releaseTag]: true });
    helper.infoMsg(promptMsg, true);
    const changelogFileR = path.relative(repoDir, changelog);
    promptMsg = 'Change Log updated: ' + colorKeys('green', { [changelogFileR]: true });
    helper.infoMsg(promptMsg, true);

    return true;
}

exports.update = updateChangelog;
