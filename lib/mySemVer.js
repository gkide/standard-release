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

function isNumber(helper, value, eMsg) {
  if('undefined' === typeof(value)) {
    return false;
  }

  if(typeof(value) === 'number' && !Number.isNaN(value)) {
    return true;
  }

  helper.errorMsg(eMsg + ' ' + value + ' is not valid number');
}

function getReleaseTag(incType, latestTag, helper) {
  if(!latestTag) { // first release
    incType = 'patch';
    latestTag = "0.0.0";
  }

  // 1. Auto SemVer
  const autoSemVer = semver.inc(latestTag, incType);
  let xMajor = semver.major(autoSemVer);
  let xMinor = semver.minor(autoSemVer);
  let xPatch = semver.patch(autoSemVer);
  // array of pre-release components, null if none exist
  let preRelease = semver.prerelease(autoSemVer);
  if(preRelease instanceof Array) {
    preRelease = preRelease.join('.');
  }
  let buildNumber = '';

  // 2. From semver.js
  let usrSemVer = config.usrSemverHooks();
  if(usrSemVer) {
    if(isNumber(helper, usrSemVer.major, "semver.js(major)")) {
      xMajor = usrSemVer.major;
    }
    if(isNumber(helper, usrSemVer.minor, "semver.js(minor)")) {
      xMinor = usrSemVer.minor;
    }
    if(isNumber(helper, usrSemVer.patch, "semver.js(patch)")) {
      xPatch = usrSemVer.patch;
    }
    if(typeof(usrSemVer.preRelease) === 'string') {
      preRelease = usrSemVer.preRelease;
    }
    if(typeof(usrSemVer.buildNumber) === 'string') {
      buildNumber = usrSemVer.buildNumber;
    }
  }

  // 3. From cmdArgs
  if(isNumber(helper, helper.cmdArgs.major, "-X")) {
    xMajor = helper.cmdArgs.major;
  }
  if(isNumber(helper, helper.cmdArgs.minor, "-Y")) {
    xMinor = helper.cmdArgs.minor;
  }
  if(isNumber(helper, helper.cmdArgs.patch, "-Z")) {
    xPatch = helper.cmdArgs.patch;
  }
  if(typeof(helper.cmdArgs.preRelease) === 'string') {
    preRelease = helper.cmdArgs.preRelease;
  }
  if(typeof(helper.cmdArgs.buildNumber) === 'string') {
    buildNumber = helper.cmdArgs.buildNumber;
  }

  let tweak = preRelease;
  if(buildNumber) {
    tweak += '+' + buildNumber;
  }

  let newSemVer = 'v' + xMajor + '.' + xMinor + '.' + xPatch;
  if(tweak) {
    newSemVer += '-' + tweak;
  }

  if(!semver.valid(newSemVer)) {
    helper.errorMsg('Semantic Version Invalid: ' + newSemVer);
  }

  return newSemVer;
}

exports.semverRegex = semverRegex;
exports.isValidSemver = semver.valid;
exports.getIncrement = getIncrement;
exports.getReleaseTag = getReleaseTag;
exports.semverCmpAscending = semverCmpAscending;
exports.semverCmpDescending = semverCmpDescending;
