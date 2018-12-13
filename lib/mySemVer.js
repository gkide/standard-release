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
    commitObj.body.split(commitParser.newLine).forEach(function(item, index) {
        if(PATTERN.test(item)) {
            isBreaking = true;
        }
    });

    commitObj.footer.split(commitParser.newLine).forEach(function(item, index) {
        if(PATTERN.test(item)) {
            isBreaking = true;
        }
    });

    return isBreaking;
}

function getIncrement(commitObj) {
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

exports.semverRegex = semverRegex;
exports.getIncrement = getIncrement;
exports.semverCmpAscending = semverCmpAscending;
exports.semverCmpDescending = semverCmpDescending;
