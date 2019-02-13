'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
//const nodefetch = require('node-fetch');
const handlebars = require('handlebars');

// Utilities
const tools = require(path.join(__dirname, 'tools'));
const config = require(path.join(__dirname, 'config'));

const UNRELEASE = /^##\s+\[Unreleased\]$/;
const RELEASE = /^##\s+[0-9]{4}-[0-9]{2}-[0-9]{2}\s+Release\s+\[([a-zA-Z0-9\+\.-]+)\].+$/;

const GROUPS = config.usrChangelogHooks();

const GROUPS_REA = new RegExp('^<span id = "_v_([a-zA-Z]+)"></span>$');
const GROUPS_REB = new RegExp('^###\\s+(\\W)\\s+([a-zA-Z]+)$');

function isKnownGroup(groupName) {
    if(!groupName) {
        return false;
    }

    let retVal = false;
    GROUPS.forEach(function(rule, index) {
        if(groupName === rule.name) {
            retVal = true;
        }
    });

    return retVal;
}

function isGroupHasName(name, group) {
    if(!name || !group) {
        return false;
    }

    let retVal = false;
    group.forEach(function(rule, index) {
        if(name === rule.name && rule.symbol) {
            retVal = true;
        }
    });

    return retVal;
}

// unrelease unknown group lines
function processUnknownGroups(unreleaseLines, unknownGroups) {
    let unknownGLS = {};
    unknownGroups.forEach(function(rule, index) {
        let flag = false;
        let skip = false;
        let tGroups = [];
        unreleaseLines.forEach(function(line, index) {
            const ma = line.match(GROUPS_REA);
            if(ma) {
                if(ma[1] == rule.name) {
                    flag = true;
                    skip = true; // skip: <span id = ...
                } else {
                    flag = false;
                }
            }

            const mb = line.match(GROUPS_REB);
            if(!ma && mb) {
                if(mb[2] == rule.name) {
                    flag = true;
                } else {
                    flag = false;
                }
            }

            if(flag && !skip && !isKnownGroup(rule.name)) {
                tGroups.push(line);
            }

            if(skip) {
                skip = false;
            }
        });

        unknownGLS[rule.name] = { data: tGroups, symbol: rule.symbol };

    });

    return unknownGLS;
}

function arrCopy(arr) {
	let res = [];
	for (let i = 0; i < arr.length; i++) {
        res.push(arr[i]);
	}
	return res;
}

function removeEmptyLines(arrayL) {
    const tmpArr = [];
    let emptyLineFlag = 1;

    // remove all leading empty lines between header & body
    arrayL.forEach(function(line, index) {
        const data = line.trim();

        if(index >= 2 && emptyLineFlag == 1) {
            emptyLineFlag = 3; // header & body no empty lines
        }

        if(data !== "" && emptyLineFlag == 2) {
            emptyLineFlag = 3;
        }

        if(emptyLineFlag == 1 && data === "") {
            emptyLineFlag = 2;
        }

        if(emptyLineFlag != 2) {
            tmpArr.push(line);
        }
    });

    arrayL = arrCopy(tmpArr);
    tmpArr.length = 0;
    emptyLineFlag = 0;

    // remove continuous empty lines more then two
    arrayL.forEach(function(line, index) {
        const data = line.trim();
        if(data === "") {
            emptyLineFlag++;
        }

        if(emptyLineFlag >= 1 && data !== "") {
            tmpArr.push('');
            emptyLineFlag = 0;
        }

        if(data !== "") {
            tmpArr.push(line);
        }
    });

    tmpArr.push('');
    arrayL = arrCopy(tmpArr);

    return arrayL;
}

function groupUnreleaseLines(unreleaseLines, helper) {
    let unreleaseGLS = {}; // unrelease group lines

    const UnknownGroups = [];

    GROUPS.forEach(function(rule, index) {
        let flag = false;
        let skip = false;
        let tGroups = [];
        let unknown = { name: '', symbol: '' };
        unreleaseLines.forEach(function(line, index) {
            // known groups
            const ma = line.match(GROUPS_REA);
            if(ma) {
                if(ma[1] == rule.name) {
                    flag = true;
                    skip = true; // skip: <span id = ...
                } else {
                    flag = false;
                    unknown = { name: ma[1].trim(), symbol: '' };
                }
            }

            const mb = line.match(GROUPS_REB);
            if(!ma && mb) {
                if(mb[2] == rule.name) {
                    flag = true;
                } else {
                    flag = false;
                    unknown = { name: mb[2].trim(), symbol: mb[1].trim() };
                }
            }

            // unknown groups
            if(unknown.name !== "" && unknown.symbol !== "" && !isKnownGroup(unknown.name)) {
                if(!isGroupHasName(unknown.name, UnknownGroups)) {
                    UnknownGroups.push(unknown);
                }
            }

            if(flag && !skip) {
                tGroups.push(line);
            }

            if(skip) {
                skip = false;
            }
        });

        unreleaseGLS[rule.name] = { data: tGroups, symbol: rule.symbol };
    });

    for(var gn in unreleaseGLS) {
        unreleaseGLS[gn].data = removeEmptyLines(unreleaseGLS[gn].data);
    }

    if(helper.cmdArgs.changelogGreed) {
        const unknownGLS = processUnknownGroups(unreleaseLines, UnknownGroups);
        for(var gn in unknownGLS) {
            unknownGLS[gn].data = removeEmptyLines(unknownGLS[gn].data);
        }
        helper.debugMsg("Unknown Groups", UnknownGroups);
        unreleaseGLS = Object.assign(unreleaseGLS, unknownGLS);
    }

    helper.debugMsg("Unrelease Groups", unreleaseGLS);
    return unreleaseGLS;
}

function runChangelogParser(changelog) {
    const textData = tools.readFile(changelog);
    const lineData = textData.split('\n');

    // Unreleased
    let unreleaseLines = [];
    let foundLastUnrelease = false;

    // Release
    let releaseLines = [];
    let foundLastRelease = false;

    let lastVersion = '';
    lineData.forEach(function(line, index) {
        //console.log('[' + index + ']=' + line);
        if(foundLastRelease) {
            releaseLines.push(line);
        } else if(!foundLastRelease && RELEASE.test(line)) {
            foundLastRelease = true;
            releaseLines.push(line);
            lastVersion = line.replace(RELEASE, '$1');
        } else if(foundLastUnrelease || UNRELEASE.test(line)) {
            foundLastUnrelease = true;
            unreleaseLines.push(line);
        }
    });

    return { U: unreleaseLines, R: releaseLines, V: lastVersion };
}

function compileTemplate(helper, newVer, oldVer, rawLogs, changelog) {
    const changelogSwap = changelog + '.swap'; // changelog swap file
    const history = runChangelogParser(changelog);
    const unrelease = groupUnreleaseLines(history.U, helper);
    //console.log(history);
    //console.log(rawLogs);

    return false;
}

exports.compile = compileTemplate;
