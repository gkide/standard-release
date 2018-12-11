'use strict'

const path = require('path');
const semver = require('semver');
const child_process = require('child_process');

const mySemVer = require(path.join(__dirname, 'mySemVer'));

const gitTagRegex = /tag:\s*(.+?)[,)]/gi
const gitLogCmd = 'git log --decorate=short --no-color';

const OPTS = {
    maxBuffer: Infinity,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe','ignore']
};

function semverTagFilter(tagPrefix, callback) {
    child_process.exec(gitLogCmd, OPTS, function(err, data) {
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
        stdoutData = child_process.execSync(gitLogCmd, OPTS);
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

exports.getLatestTag = getLatestTag;
exports.getEarliestTag = getEarliestTag;
exports.semverTagFilter = semverTagFilter;

exports.getLatestTagSync = getLatestTagSync;
exports.getEarliestTagSync = getEarliestTagSync;
exports.semverTagFilterSync = semverTagFilterSync;
