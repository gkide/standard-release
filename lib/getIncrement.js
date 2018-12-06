'use strict';

const path = require('path');
const gitCommit = require(path.join(__dirname, 'commitParser'));

function isBreakingChange(commitObj) {
    const PATTERN = /^\[BREAKING\s+CHANGES\]\s+/;
    if(PATTERN.test(commitObj.headerObj.subject)) {
        return true;
    }

    let isBreaking = false;
    commitObj.body.split(gitCommit.newLine).forEach(function(item, index) {
        if(PATTERN.test(item)) {
            isBreaking = true;
        }
    });

    commitObj.footer.split(gitCommit.newLine).forEach(function(item, index) {
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

exports.getIncrement = getIncrement;
