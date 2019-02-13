'use strict';

// Native
const path = require('path');

// Packages
const semver = require('semver');

// Utilities
const config = require(path.join(__dirname, 'config'));
const myCommit = require(path.join(__dirname, 'myCommit'));

// taken from https://github.com/sindresorhus/semver-regex
const semverRegex = /\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/ig;

// Sort Ascending
// If semver version a equals b, return 0;
// If semver version a is greater than b, return 1.
// If semver version a is lesser than b, return -1.
function semverCmpAscending(a, b) {
    const sva = semver.clean(a);
    const svb = semver.clean(b);
    if(semver.gt(sva, svb)) { // sva > svb
        return 1;
    }
    
    if(semver.lt(sva, svb)) { // sva < svb
        return -1;
    }
    
    return 0;
};

// Sort Descending
// If semver version a equals b, return 0;
// If semver version a is greater than b, return -1.
// If semver version a is lesser than b, return 1.
function semverCmpDescending(a, b) {
    const sva = semver.clean(a);
    const svb = semver.clean(b);
    if(semver.gt(sva, svb)) { // sva > svb
        return -1;
    }

    if(semver.lt(sva, svb)) { // sva < svb
        return 1;
    }

    return 0;
};

function isBreakingChange(commitRaw) {
    const PATTERN = /^\[BREAKING\s+CHANGES(#\d+)*\]\s+/;
    if(PATTERN.test(commitRaw.headerObj.subject)) {
        return true;
    }

    let isBreaking = false;
    if(commitRaw.bodyMsg) {
        commitRaw.bodyMsg.split(myCommit.newLine).forEach(function(item, index) {
            if(PATTERN.test(item)) {
                isBreaking = true;
            }
        });
    }

    if(commitRaw.footerMsg) {
        commitRaw.footerMsg.split(myCommit.newLine).forEach(function(item, index) {
            if(PATTERN.test(item)) {
                isBreaking = true;
            }
        });
    }

    return isBreaking;
}

function commitKeySearch(keyArray, rawKey) {
    let isFound = false;
    keyArray.forEach(function(data) {
        //console.log('commitKeySearch: data=' + data + ', key=' + rawKey);
        if(data == rawKey) {
            isFound = true;
        }
    });
    return isFound;
}

function getIncrement(commitRaw, usrRules) {
    if(!commitRaw.headerObj) {
        return { skip: true };
    }

    let incType = false;
    let isBreaking = isBreakingChange(commitRaw);

    if(isBreaking) {
        return { incrementType: 'major' };
    }

    const rawKey = commitRaw.headerObj.type;

    if(commitKeySearch(usrRules.tweak.keys, rawKey)) {
        incType = 'tweak';
    }

    if(commitKeySearch(usrRules.patch.keys, rawKey)) {
        incType = 'patch';
    }

    if(commitKeySearch(usrRules.minor.keys, rawKey)) {
        incType = 'minor';
    }

    if(commitKeySearch(usrRules.major.keys, rawKey)) {
        incType = 'major';
    }

    return { incrementType: incType };
}

function getReleaseTag(incType, latestTag, helper) {
    if(!latestTag) {
        // for first release
        incType = 'patch';
        latestTag = "0.0.0";
    }
    let latestVersion = semver.inc(latestTag, incType);
    let latestMajor = semver.major(latestVersion);
    let latestMinor = semver.minor(latestVersion);
    let latestPatch = semver.patch(latestVersion);
    // return an array of prerelease components, or null if none exist
    let latestPreRelease = helper.cmdArgs.preRelease || semver.prerelease(latestVersion);
    let latestBuildNumber = helper.cmdArgs.buildNumber;

    let usrConfigSemver = config.usrSemverHooks();
    if(usrConfigSemver) {
        if(usrConfigSemver.major) {
            latestMajor = usrConfigSemver.major;
        }
        if(usrConfigSemver.minor) {
            latestMinor = usrConfigSemver.minor;
        }
        if(usrConfigSemver.patch) {
            latestPatch = usrConfigSemver.patch;
        }
        if(usrConfigSemver.preRelease) {
            latestPreRelease = usrConfigSemver.preRelease;
        }
        if(usrConfigSemver.buildNumber) {
            latestBuildNumber = usrConfigSemver.buildNumber;
        }
    }

    let aNum = helper.cmdArgs.major;
    if(typeof(aNum) === 'number' && !Number.isNaN(aNum)) {
        latestMajor = helper.cmdArgs.major;
    }
    aNum = helper.cmdArgs.minor;
    if(typeof(aNum) === 'number' && !Number.isNaN(aNum)) {
        latestMinor = helper.cmdArgs.minor;
    }
    aNum = helper.cmdArgs.patch;
    if(typeof(aNum) === 'number' && !Number.isNaN(aNum)) {
        latestPatch = helper.cmdArgs.patch;
    }

    latestVersion = 'v' + latestMajor + '.' + latestMinor + '.' + latestPatch;
    if(latestPreRelease) {
        if(latestPreRelease instanceof Array) {
            latestVersion = latestVersion + '-' + latestPreRelease.join('.');
        } else {
            latestVersion = latestVersion + '-' + latestPreRelease;
        }
    }
    if(latestBuildNumber) {
        if(latestBuildNumber instanceof Array) {
            latestVersion = latestVersion + '+' + latestBuildNumber.join('.');
        } else {
            latestVersion = latestVersion + '+' + latestBuildNumber;
        }
    }
    if(!semver.valid(latestVersion)) {
        helper.errorMsg('Project semantic version invalid: ' + latestVersion);
    }
    return latestVersion;
}

exports.semverRegex = semverRegex;
exports.isValidSemver = semver.valid;
exports.getIncrement = getIncrement;
exports.getReleaseTag = getReleaseTag;
exports.semverCmpAscending = semverCmpAscending;
exports.semverCmpDescending = semverCmpDescending;
