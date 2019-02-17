'use strict';

// Native
const fs = require('fs');
const path = require('path');
const stream = require('stream');
const child_process = require('child_process');

// Packages
const semver = require('semver');
const shelljs = require('shelljs');

// Utilities
const mySemVer = require(path.join(__dirname, 'mySemVer'));

const gitTagRegex = /tag:\s*(.+?)[,)]/gi
const gitLogCmd = 'git log --decorate=short --no-color';

const gitTagOpts = {
    maxBuffer: Infinity,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe','ignore']
};

function semverTagFilter(tagPrefix, callback) {
    child_process.exec(gitLogCmd, gitTagOpts, function(err, data) {
        if(err) {
            callback(err, [], []);
            return;
        }

        const semTagsArray = [];
        const gitTagsArray = [];
        data.split('\n').forEach(function(element) {
            const tagArray = element.match(gitTagRegex);
            if(tagArray) {
                tagArray.forEach(function(item) {
                    if(item) {
                        let matches
                        if(tagPrefix) {
                            const tagRegexp = new RegExp('^(?:tag:\\s*' + tagPrefix + ')([^,\\)]+)');
                            matches = item.match(tagRegexp);
                        } else {
                            // matches = item.match(/^(tag:\s*)([^,\)]+)/);
                            const tagRegexp = new RegExp('^(?:tag:\\s*)([^,\\)]+)');
                            matches = item.match(tagRegexp);
                        }
                        if(matches && matches[1]) {
                            let tagValue = matches[1];
                            const isSemverTag = semver.valid(tagValue);
                            if(tagPrefix) {
                                tagValue = tagPrefix + tagValue;
                            }
                            if(isSemverTag) {
                                semTagsArray.push(tagValue);
                            } else {
                                gitTagsArray.push(tagValue);
                            }
                        }
                    }
                });
            }
        });
        callback(null, semTagsArray, gitTagsArray);
    });
}

function semverTagFilterSync(tagPrefix) {
    let stdoutData
    try {
        stdoutData = child_process.execSync(gitLogCmd, gitTagOpts);
    } catch(err) {
        // console.log(err);
    }

    if(!stdoutData) {
        return { semTags: [], gitTags: [] };
    }

    const semTagsArray = [];
    const gitTagsArray = [];
    stdoutData.split('\n').forEach(function(element) {
        const tagArray = element.match(gitTagRegex);
        if(tagArray) {
            tagArray.forEach(function(item) {
                if(item) {
                    let matches
                    if(tagPrefix) {
                        const tagRegexp = new RegExp('^(?:tag:\\s*' + tagPrefix + ')([^,\\)]+)');
                        matches = item.match(tagRegexp);
                    } else {
                        // matches = item.match(/^(tag:\s*)([^,\)]+)/);
                        const tagRegexp = new RegExp('^(?:tag:\\s*)([^,\\)]+)');
                        matches = item.match(tagRegexp);
                    }
                    if(matches && matches[1]) {
                        let tagValue = matches[1];
                        const isSemverTag = semver.valid(tagValue);
                        if(tagPrefix) {
                            tagValue = tagPrefix + tagValue;
                        }
                        if(isSemverTag) {
                            semTagsArray.push(tagValue);
                        } else {
                            gitTagsArray.push(tagValue);
                        }
                    }
                }
            });
        }
    });

    return { semTags: semTagsArray, gitTags: gitTagsArray };
}


function getEarliestTag(tagPrefix, callback) {
    semverTagFilter(tagPrefix, (err, semTags, gitTags) => {
        if(err) {
            callback(null);
            return;
        }

        semTags.sort(mySemVer.semverCmpAscending);
        //console.log(semTags.join('\n'));
        callback(semTags[0]);
    });
}

function getEarliestTagSync(tagPrefix) {
    const tags = semverTagFilterSync(tagPrefix);
    tags.semTags.sort(mySemVer.semverCmpAscending);
    return tags.semTags[0];
}

function getLatestTag(tagPrefix, callback) {
    semverTagFilter(tagPrefix, (err, semTags, gitTags) => {
        if(err) {
            callback(null);
            return null;
        }

        semTags.sort(mySemVer.semverCmpDescending);
        //console.log(semTags.join('\n'));
        callback(semTags[0]);
    });
}

function getLatestTagSync(tagPrefix) {
    const tags = semverTagFilterSync(tagPrefix);
    tags.semTags.sort(mySemVer.semverCmpDescending);
    return tags.semTags[0];
}

function getRawCommits(usrArgs) {
    const DELIMITER = '===========================================================';

    function getGitArgs(gitArgs) {
        const gitOpts = ['log'];

        if(gitArgs.format) {
            gitOpts.push('--format=' + gitArgs.format + '%n' + DELIMITER);
        } else {
            gitOpts.push('--format=%h%n' + '%B%n' + DELIMITER);
        }

        const gitTo = gitArgs.to || 'HEAD';
        const gitFrom = gitArgs.from || '';
        const gitFromTo = [gitFrom, gitTo].filter(Boolean).join('..');
        gitOpts.push(gitFromTo);

        if(gitArgs.path) {
            gitOpts.push('--', gitArgs.path);
        }

        if(gitArgs.extra) {
            return gitOpts.concat(gitArgs.extra);
        }

        return gitOpts;
    }

    const gitArgs = getGitArgs(usrArgs || {});

    if(usrArgs.debug) {
        console.log('The git-log command is:\ngit ' + gitArgs.join(' '))
    }

    const rawCommits = child_process.execFileSync('git', gitArgs, {
        cwd: usrArgs.cwd || process.cwd(),
        maxBuffer: Infinity
    });

    if(!rawCommits) {
        return [];
    }
    return rawCommits.toString().split(DELIMITER+'\n');
}

function getGitRemoteUrl() {
    let stdout;
    try {
        const gitRemoteCmd = 'git remote -v';
        stdout = child_process.execSync(gitRemoteCmd, { encoding: 'utf8'});
    } catch(err) {
        return '';
    }
    if(/^origin\s*/.test(stdout)) {
        const data = /^origin\s*([^\s\(\)]*)/.exec(stdout);
        return data[1]; // the catch string
    }
    return '';
}

function getGitRemoteUrlHttps() {
    let url = getGitRemoteUrl();
    if(!url) {
        return '';
    }

    // git@github.com:npm/node-semver.git
    // https://github.com/npm/node-semver.git
    if(/^git@([\dA-Za-z\.\-\?\#\_\/]+)+:([\dA-Za-z\.\-\?\#\_\/]+)$/.test(url)) {
        const data = /^git@([\dA-Za-z\.\-\?\#\_\/]+)+:([\dA-Za-z\.\-\?\#\_\/]+)$/.exec(url);
        url = 'https://' + data[1] + '/' + data[2];
    }

    if(/^https:\/\/([\dA-Za-z\.\-\?\#\_\/]+)$/.test(url)) {
        return url;
    } else {
        return '';
    }
}

function getRepoDirectory(prjDir) {
    shelljs.config.silent = true;
    if(prjDir) {
        shelljs.cd(prjDir);
    }
    const obj = shelljs.exec('git rev-parse --show-toplevel');
    if(obj.code != 0) {
        return '';
    }
    return obj.stdout.replace('\n', '');
}

function getGitDir() {
    let repoDir = getRepoDirectory();
    if(repoDir) {
        return path.join(repoDir, '.git');
    }

    return '';
}

function repoHasTag(tagName, helper) {
    let prefix = 'v';
    const regExp = /^([a-zA-Z+-]+)([0-9\.]+)(.+)$/g;
    const match = regExp.exec(tagName);

    if(match) {
        prefix = match[1];
    }

    const tags = semverTagFilterSync(prefix).semTags;

    if(tags.length == 0) {
        return false;
    }

    let isOK = false;
    tags.some(function(tag) {
        if(tag === tagName) {
            isOK = true;
            console.log('repo has tag');
            return true; // break
        }
    });

    if(!isOK) {
        const colorKeys = helper.colorKeys;
        tags.some(function(tag) {
             helper.warnMsg("repo has tag " + colorKeys('green', { [tag]: true}));
        });
    }

    return isOK;
}

exports.getGitDir = getGitDir;
exports.getRawCommits = getRawCommits;
exports.getRepoDirectory = getRepoDirectory;

exports.getGitRemoteUrl = getGitRemoteUrl;
exports.getGitRemoteUrlHttps = getGitRemoteUrlHttps;

exports.repoHasTag = repoHasTag;
exports.getLatestTag = getLatestTag;
exports.getEarliestTag = getEarliestTag;
exports.semverTagFilter = semverTagFilter;

exports.getLatestTagSync = getLatestTagSync;
exports.getEarliestTagSync = getEarliestTagSync;
exports.semverTagFilterSync = semverTagFilterSync;
