'use strict';

const fs = require('fs');
const util = require('util');
const path = require('path');

function updateChangelog(helper) {
    const changelogFile = path.resolve(process.cwd(), helper.cmdArgs.changelog);
    console.log("[TODO] " + changelogFile);
    return false;
}

exports.updateChangelog = updateChangelog;
