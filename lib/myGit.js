'use strict';

const fs = require('fs');
const path = require('path');
const semver = require('semver');
const stream = require('stream');
const child_process = require('child_process');
const findParentDir = require('find-parent-dir');
const mySemVer = require(path.join(__dirname, 'mySemVer'));

function findRepoDir() {
    const dir = findParentDir.sync(process.cwd(), '.git');
    if(!dir) throw new Error('Can not find .git folder');

    let gitDir = path.join(dir, '.git');
    const stats = fs.lstatSync(gitDir);

    if (!stats.isDirectory()) {
        // Expect following format
        // git: pathToGit
        const pathToGit = fs
            .readFileSync(gitDir, 'utf-8')
            .split(':')[1]
            .trim();
        gitDir = path.join(dir, pathToGit);

        if(!fs.existsSync(gitDir)) {
            throw new Error('Cannot find file ' + pathToGit);
        }
    }

    return gitDir;
}

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
            gitOpts.push('--format=%B' + '%n' + DELIMITER);
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

exports.findRepoDir = findRepoDir;
exports.getRawCommits = getRawCommits;

exports.getLatestTag = getLatestTag;
exports.getEarliestTag = getEarliestTag;
exports.semverTagFilter = semverTagFilter;

exports.getLatestTagSync = getLatestTagSync;
exports.getEarliestTagSync = getEarliestTagSync;
exports.semverTagFilterSync = semverTagFilterSync;