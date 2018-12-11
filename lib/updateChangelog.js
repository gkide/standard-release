'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

const tools = require(path.join(__dirname, 'tools'));
const mySemVer = require(path.join(__dirname, 'mySemVer'));
const gitCommit = require(path.join(__dirname, 'commitParser'));
const getIncrement = require(path.join(__dirname, 'getIncrement')).getIncrement;

function updateChangelog(helper) {
    const changelogFile = path.resolve(process.cwd(), helper.cmdArgs.changelog);
    console.log("[TODO] " + changelogFile);
    console.log(getIncrement(gitCommit.parseCommitFromCmdArgs(helper)));

    return false;
}

exports.updateChangelog = updateChangelog;
