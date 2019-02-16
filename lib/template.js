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
const RELEASE = /^##\s+[0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2}\s+([\s+-])*[0-9]{4}\s+Release\s+\[([a-zA-Z0-9\+\.-]+)\].+$/;

const GROUPS = config.usrChangelogHooks();

const GROUPS_REA = new RegExp('^<span id = "v_([a-zA-Z]+)"></span>$');
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
        helper.debugMsg("Unrelease Unknown Groups", UnknownGroups);
        unreleaseGLS = Object.assign(unreleaseGLS, unknownGLS);
    }

    helper.debugMsg("Unrelease Changelog Groups", unreleaseGLS);
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

// timesid: YYYY MM DD hh mm ss ZZZZ
function getSpanId(key, timesid) {
    if(timesid) {
        return '<span id = "v_' + key + '_' + timesid + '"></span>';
    } else {
        return '<span id = "v_' + key + '"></span>';
    }
}

// symbol list just after release for quick navigation
function navigationUrl(spanId, symbol) {
    return "[" + "[" + symbol + "]" + "(#" + spanId + ")" + "]";
}

function mergeRawLogs(rawLogs, unreleaseLogs, isRelease) {
    let timestamp = "";
    let symbolList = [];
    if(isRelease) { // changelog release
        timestamp = tools.getTimestamp("YYYYMMDDhhmmssZZZZ");
        timestamp = timestamp.replace(/[+-]/g, '');
    }

    for(var key in unreleaseLogs) {
        let data = unreleaseLogs[key].data;
        if(isKnownGroup(key)) {
            const logs = rawLogs.rawData[key];
            if(logs.length > 0) {
                logs.forEach(function(line, index) {
                    const msgHp = /^(\w+)(?:\(([^\)\s]+)\))?:\s+(.+)$/;
                    const match = msgHp.exec(line);
                    let type = match[1];
                    let scope = match[2];
                    let subject = match[3];
                    let tmsg = '- **' + type + '**';

                    if(data.length == 0) {
                        data.push('### ' + unreleaseLogs[key].symbol + ' ' + key);
                    }

                    if(scope) {
                        data.push(tmsg + '(`' + scope + '`)' + ': ' + subject);
                    } else {
                        data.push(tmsg + ': ' + subject);
                    }
                });
            }
        }

        // insert span ID only for changelog release
        let minLineCnt = 1;
        if(isRelease) {
            minLineCnt = 2;
            const spanId = getSpanId(key, timestamp);
            const symbol = unreleaseLogs[key].symbol;
            if(data.length > 1 && symbol) {
                data.unshift(spanId);
                symbolList.push(navigationUrl(spanId, symbol));
            }
        }

        if(data.length > minLineCnt) {
            // if only group and span ID, just skip
            unreleaseLogs[key].data = data;
        } else {
            // remove the group if no log data
            data.splice(key, 1);
        }
    }

    return { data: unreleaseLogs, navi: symbolList };
}

// changelog fixed header message
const HeaderMsg = [
    '# Change Log',
    '',
    '- ALL NOTABLE CHANGES WILL BE DOCUMENTED HERE.',
    '- PROJECT VERSIONS ADHERE TO [SEMANTIC VERSIONING](http://semver.org).',
    '- REPOSITORY COMMITS ADHERE TO [CONVENTIONAL COMMITS](https://conventionalcommits.org).',
];

function compileTemplate(helper, newVer, oldVer, rawLogs, changelog) {
    let isRelease = false;
    let title = '## [Unreleased]';
    if(helper.cmdArgs.changelogRelease) {
        isRelease = true;
        const timestamp = tools.getTimestamp("ISO-8601");
        title =  '## ' + timestamp + ' Release ' + newVer;
        if(rawLogs.repoUrl.release) {
            title =  '## ' + timestamp + ' Release ' + '[' + newVer + ']';
            title = title + '(' + rawLogs.repoUrl.release + '/' + newVer + ')';
        }
    } else {
        // if not release, keep all unknown groups
        helper.cmdArgs.changelogGreed = true;
    }

    const history = runChangelogParser(changelog);
    const unrelease = groupUnreleaseLines(history.U, helper);

    // new generated changelog message
    let changelogMsg = HeaderMsg.join('\n') + '\n\n\n' + title + '\n';
    const logs = mergeRawLogs(rawLogs, unrelease, isRelease);

    if(isRelease && logs.navi) {
        changelogMsg = changelogMsg + '\n' + logs.navi.join('\n');
        if(oldVer) {
            let URL = rawLogs.repoUrl.compare + '/' + oldVer + '...' + newVer;
            const cmpMsg = 'comparing with [' + oldVer + '](' + URL + ')';
            changelogMsg = changelogMsg + '\n' + cmpMsg + '\n\n';
        }
    }

    for(var key in logs.data) {
        const array = logs.data[key].data;
        if(array.length != 0) {
            changelogMsg = changelogMsg + array.join('\n') + '\n\n';
        }
    }

    // old changelog message
    changelogMsg = changelogMsg + '\n' + history.R.join('\n');

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

function writeUnrelease(changelog) {
    const head = HeaderMsg.join('\n') + '\n\n\n';
    const unreleased = '## [Unreleased]' + '\n';
    let bodyMsg = '';
    GROUPS.forEach(function(rule, index) {
        if(!rule.skip && rule.name && rule.symbol) {
            bodyMsg = bodyMsg + '### ' + rule.symbol + ' ' + rule.name;
            if(GROUPS.length > index + 1) {
                bodyMsg = bodyMsg + '\n';
            }
        }
    });
    tools.writeFile(changelog, head + unreleased + bodyMsg);
}

function insertUnrelease(changelog, helper) {
    const data = tools.readFile(changelog);
    if(!data) {
        writeUnrelease(changelog);
        return true;
    }

    const logs = [];
    let hasUnreleased = false;
    let skipHeaderLines = false;
    const array = data.split('\n');
    array.forEach(function(line, index) {
        if('## [Unreleased]' === line) {
            hasUnreleased = true;
        } else {
            if(!skipHeaderLines) {
                HeaderMsg.some(function(head, idx) {
                    if(head === line && idx == 4) {
                        skipHeaderLines = true;
                    }
                });
            } else {
                logs.push(line);
            }
        }
    });

    if(hasUnreleased) {
        helper.warnMsg("changelog already has [Unrelease].");
        return false;
    }

    writeUnrelease(changelog);
    tools.appendToFile(changelog, '\n' + logs.join('\n'));
    return true;
}

exports.compile = compileTemplate;
exports.initChangelog = writeUnrelease;
exports.insertUnrelease = insertUnrelease;
