'use strict'

const path = require('path');
const semver = require('semver');
const child_process = require('child_process');

const mySemVer = require(path.join(__dirname, 'mySemVer'));

const gitTagRegex = /tag:\s*(.+?)[,)]/gi;
const gitLogCmd = 'git log --decorate=short --no-color';

function semverTagFilter(tagPrefix, callback) {
    child_process.exec(gitLogCmd, { maxBuffer: Infinity }, function(err, data) {
        if(err) {
            callback(err, []);
            return;
        }

        const tags = [];
        data.split('\n').forEach(function(element) {
            const tagArray = gitTagRegex.exec(element);
            if(tagArray) {
                tagArray.forEach(function(item) {
                    if(item) {
                        if(tagPrefix) {
                            const tagRegexp = new RegExp('^' + tagPrefix + '(.*)');
                            const matches = item.match(tagRegexp);
                            if(matches && semver.valid(matches[1])) {
                                tags.push(item);
                            }
                        } else if(semver.valid(item)) {
                            tags.push(item);
                        }
                    }
                });
            }
        });
        callback(null, tags);
    });
}

function semverTagFilterSync(tagPrefix) {
    const opts = { maxBuffer: Infinity, encoding: 'utf8' };
    const stdoutData = child_process.execSync(gitLogCmd, opts);
    if(!stdoutData) {
        return [];
    }

    const tags = [];
    stdoutData.split('\n').forEach(function(element) {
        const tagArray = gitTagRegex.exec(element);
        if(tagArray) {
            tagArray.forEach(function(item) {
                if(item) {
                    if(tagPrefix) {
                        const tagRegexp = new RegExp('^' + tagPrefix + '(.*)');
                        const matches = item.match(tagRegexp);
                        if(matches && semver.valid(matches[1])) {
                            tags.push(item);
                        }
                    } else if(semver.valid(item)) {
                        tags.push(item);
                    }
                }
            });
        }
    });

    return tags;
}


function getEarliestTag(tagPrefix, callback) {
    semverTagFilter(tagPrefix, (err, tags) => {
        if(err) {
            callback(null);
            return;
        }

        tags.sort(mySemVer.semverCmpAscending);
        //console.log(tags.join('\n'));
        callback(tags[0]);
    });
}

function getEarliestTagSync(tagPrefix) {
    const tags = semverTagFilterSync(tagPrefix);
    tags.sort(mySemVer.semverCmpAscending);
    return tags[0];
}

function getLatestTag(tagPrefix, callback) {
    semverTagFilter(tagPrefix, (err, tags) => {
        if(err) {
            callback(null);
            return null;
        }

        tags.sort(mySemVer.semverCmpDescending);
        //console.log(tags.join('\n'));
        callback(tags[0]);
    });
}

function getLatestTagSync(tagPrefix) {
    const tags = semverTagFilterSync(tagPrefix);
    tags.sort(mySemVer.semverCmpDescending);
    return tags[0];
}

exports.getLatestTag = getLatestTag;
exports.getEarliestTag = getEarliestTag;
exports.semverTagFilter = semverTagFilter;

exports.getLatestTagSync = getLatestTagSync;
exports.getEarliestTagSync = getEarliestTagSync;
exports.semverTagFilterSync = semverTagFilterSync;
