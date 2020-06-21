'use strict';

// Native
const path = require('path');

// Utilities
const myRules = require(path.join(__dirname, 'myRules'));
const hasFile = require(path.join(__dirname, 'tools')).hasFile;
const getUsrRepo = require(path.join(__dirname, 'myGit')).getRepoDirectory;

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

function usrCommitHooks() {
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
function hasUsrSemverHooks() {
  return hasFile(path.join(getUsrHome(), usrSemverRules));
}

function usrSemverHooks() {
  if(hasUsrSemverHooks()) {
    let user = path.join(getUsrHome(), usrSemverRules);
    return require(user).semverRules;
  } else {
    return null;
  }
}

// get user changelog configuration
const usrChangelogRules = "changelog.js";
function hasUsrChangelogHooks() {
  return hasFile(path.join(getUsrHome(), usrChangelogRules));
}

function usrChangelogHooks() {
  if(hasUsrChangelogHooks()) {
    let user = path.join(getUsrHome(), usrChangelogRules);
    return require(user).changelogRules;
  } else {
    // user commit rules missing, back to default
    return myRules.changelogRules;
  }
}

function getChangelog(helper, changelog) {
  const repoDir = getUsrRepo();
  if(!repoDir) {
    helper.errorMsg('Not a git repo, stop.');
  }

  if(!changelog) {
    changelog = 'CHANGELOG.md'
  }
  changelog = path.resolve(process.cwd(), changelog);

  if(!hasFile(changelog)) {
    try { // create it if not exist
      helper.tryCreate(changelog, null, '');
    } catch(err) {
      helper.errorMsg("Can not create '" + changelog + "'");
    }
  }
  return changelog;
}

exports.getUsrHome = getUsrHome;

exports.usrSemverHooks = usrSemverHooks;
exports.hasUsrSemverHooks = hasUsrSemverHooks;

exports.usrCommitHooks = usrCommitHooks;
exports.hasUsrCommitHooks = hasUsrCommitHooks;

exports.getChangelog = getChangelog;
exports.usrChangelogHooks = usrChangelogHooks;
exports.hasUsrChangelogHooks = hasUsrChangelogHooks;
