'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Utilities
const myRules = require(path.join(__dirname, 'myRules'));
const getUsrRepo = require(path.join(__dirname, 'myGit')).getRepoDirectory;

function hasFile(fileName) {
    try {
        fs.accessSync(fileName, fs.constants.R_OK);
        return true;
    } catch(err) {
        return false;
    }
}

// get user configuration home
const usrHome = ".standard-release";
function getUsrHome(repo) {
    if(typeof(repo) != 'undefined') {
        return path.join(repo, usrHome);
    }
    return path.join(getUsrRepo() || process.cwd(), usrHome);
}

// get user commit rules configuration
const usrCommitRules = "commit.js";
function hasUsrCommitHooks() {
    return hasFile(path.join(getUsrHome(), usrCommitRules));
}

function getCommitHooks() {
    if(hasUsrCommitHooks()) {
        let user = path.join(getUsrHome(), usrCommitRules);
        return require(user).commitRules;
    } else {
        // user commit rules missing, back to default
        return myRules.commitRules;
    }
}

// get user semver configuration
const usrSemverRules = "semver.js";
function usrSemverHooks() {
    return path.join(getUsrHome(), usrSemverRules);
}

function hasUsrSemverHooks() {
    return hasFile(usrSemverHooks());
}

// get user changelog configuration
const usrChangelogRules = "changelog.js";
function usrChangelogHooks() {
    return path.join(getUsrHome(), usrChangelogRules);
}

function hasUsrChangelogHooks() {
    return hasFile(usrChangelogHooks());
}

exports.getUsrHome = getUsrHome;

exports.usrSemverHooks = usrSemverHooks;
exports.hasUsrSemverHooks = hasUsrSemverHooks;

exports.getCommitHooks = getCommitHooks;
exports.hasUsrCommitHooks = hasUsrCommitHooks;

exports.usrChangelogHooks = usrChangelogHooks;
exports.hasUsrChangelogHooks = hasUsrChangelogHooks;
