'use strict';

const path = require('path');
const semver = require('semver');
const commitParser = require(path.join(__dirname, 'commitParser'));

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

function isBreakingChange(commitObj) {
    const PATTERN = /^\[BREAKING\s+CHANGES(#\d+)*\]\s+/;
    if(PATTERN.test(commitObj.headerObj.subject)) {
        return true;
    }

    let isBreaking = false;
    if(commitObj.bodyMsg) {
        commitObj.bodyMsg.split(commitParser.newLine).forEach(function(item, index) {
            if(PATTERN.test(item)) {
                isBreaking = true;
            }
        });
    }

    if(commitObj.footerMsg) {
        commitObj.footerMsg.split(commitParser.newLine).forEach(function(item, index) {
            if(PATTERN.test(item)) {
                isBreaking = true;
            }
        });
    }

    return isBreaking;
}

function getIncrement(commitObj) {
    if(!commitObj.headerObj) {
        return { skip: true };
    }

    let commitIncrement = false;
    let isBreaking = isBreakingChange(commitObj);

    if(/fix|bugfix|patch/.test(commitObj.headerObj.type)) {
        commitIncrement = 'patch';
    }

    if(/feat|feature|minor/.test(commitObj.headerObj.type)) {
        commitIncrement = 'minor';
    }

    if(/break|breaking|major/.test(commitObj.headerObj.type) || isBreaking) {
        commitIncrement = 'major';
    }

    isBreaking = isBreaking || commitIncrement === 'major';

    return { incrementType: commitIncrement, isBreaking };
}

function getReleaseTag(incType, latestTag, configSemver, helper) {
    if(!latestTag) {
        // for first release
        incType = 'patch';
        latestTag = "0.0.0";
    }
    let latestVersion = semver.inc(latestTag, incType);
    let latestMajor = semver.major(latestVersion);
    let latestMinor = semver.minor(latestVersion);
    let latestPatch = semver.patch(latestVersion);
    let latestPreRelease = helper.cmdArgs.preRelease || semver.prerelease(latestVersion);
    let latestBuildNumber = helper.cmdArgs.buildNumber;

    if(configSemver) {
        if(configSemver.major) {
            latestMajor = configSemver.major;
        }
        if(configSemver.minor) {
            latestMinor = configSemver.minor;
        }
        if(configSemver.patch) {
            latestPatch = configSemver.patch;
        }
        if(configSemver.preRelease) {
            latestPreRelease = configSemver.preRelease;
        }
        if(configSemver.buildNumber) {
            latestBuildNumber = configSemver.buildNumber;
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
exports.getIncrement = getIncrement;
exports.getReleaseTag = getReleaseTag;
exports.semverCmpAscending = semverCmpAscending;
exports.semverCmpDescending = semverCmpDescending;
