'use strict';

const semver = require('semver');

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

exports.semverRegex = semverRegex;
exports.semverCmpAscending = semverCmpAscending;
exports.semverCmpDescending = semverCmpDescending;
