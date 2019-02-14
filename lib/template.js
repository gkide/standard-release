'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages


// Utilities
const myGit = require(path.join(__dirname, 'myGit'));
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

Date.prototype.Format = function(fmt) {
    var o = {
        "M+": this.getMonth() + 1,  // month
        "D+": this.getDate(),       // day
        "H+": this.getHours(),      // hour
        "m+": this.getMinutes(),    // minute
        "s+": this.getSeconds(),    // second
        "S": this.getMilliseconds() // microsecond
    };

    if(/(Y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }

    for(var k in o) {
        if(new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1)
                                         ? (o[k])
                                         : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}

// Get current year, month, day
function getYYYYMMDD() {
    return new Date().Format("YYYY-MM-DD");
}

function getSpanId(key, YYYYMMDD) {
    if(YYYYMMDD) {
        return '<span id = "_v_' + key + '_' + YYYYMMDD + '"></span>';
    } else {
        return '<span id = "_v_' + key + '"></span>';
    }
}

function mergeRawLogs(rawLogs, unreleaseLogs, isRelease) {
    let YYYYMMDD = "";

    if(isRelease) { // changelog release
        YYYYMMDD = getYYYYMMDD().replace(/-/g, '');
    }

    for(var key in unreleaseLogs) {
        let data = unreleaseLogs[key].data;
        const spanId = getSpanId(key, YYYYMMDD);
        data.unshift(spanId);

        for(var group in rawLogs.rawData) {
            const logs = rawLogs.rawData[group];
            if(key === group && logs.length != 0) {
                logs.forEach(function(line, index) {
                    const msgHp = /^(\w+)(?:\(([^\)\s]+)\))?:\s+(.+)$/;
                    const match = msgHp.exec(line);
                    let type = match[1];
                    let scope = match[2];
                    let subject = match[3];
                    let tmsg = '- **' + type + '**';
                    if(scope) {
                        data.push(tmsg + '(`' + scope + '`)' + ': ' + subject);
                    } else {
                        data.push(tmsg + ': ' + subject);
                    }
                });
                break;
            }
        }
        unreleaseLogs[key].data = data;
    }
    return unreleaseLogs;
}

const ChangelogHeaderMsg = [
    '# Change Log',
    '',
    '- ALL NOTABLE CHANGES WILL BE DOCUMENTED HERE.',
    '- PROJECT VERSIONS ADHERE TO [SEMANTIC VERSIONING](http://semver.org).',
    '- REPOSITORY COMMITS ADHERE TO [CONVENTIONAL COMMITS](https://conventionalcommits.org).',
];

function compileTemplate(helper, newVer, oldVer, rawLogs, changelog) {
    const history = runChangelogParser(changelog);
    const unrelease = groupUnreleaseLines(history.U, helper);

    let isRelease = false;
    let title = '## [Unreleased]';
    if(helper.cmdArgs.changelogRelease) {
        isRelease = true;
        title =  '## ' + getYYYYMMDD() + ' Release ' + newVer;
        if(rawLogs.repoUrl.release) {
            title =  '## ' + getYYYYMMDD() + ' Release ' + '[' + newVer + ']';
            title = title + '(' + rawLogs.repoUrl.release + '/' + newVer + ')';
        }
    }

    const logs = mergeRawLogs(rawLogs, unrelease, isRelease);
    // new generated changelog message
    let changelogMsg = ChangelogHeaderMsg.join('\n') + '\n\n' + title + '\n\n';
    for(var key in logs) {
        const array = logs[key].data;
        if(array.length != 0) {
            changelogMsg = changelogMsg + array.join('\n') + '\n\n';
        }
    }

    // old changelog message
    changelogMsg = changelogMsg + history.R.join('\n') + '\n\n';

    const changelogSwap = changelog + '.swap'; // changelog swap file
    try {
        helper.tryCreate(changelogSwap, null, changelogMsg);
    } catch(err) {
        helper.errorMsg('Can not write temp changlog file: ' + changelogSwap);
    }

    fs.unlinkSync(changelog);
    fs.renameSync(changelogSwap, changelog)

    // get & show changelog relative path
    const CLRP = path.relative(myGit.getRepoDirectory(), changelog);
    const CMSG = helper.colorKeys('green', { [CLRP]: true });
    helper.infoMsg('Updated changelog: ' + CMSG, true);

    return true;
}

exports.compile = compileTemplate;
