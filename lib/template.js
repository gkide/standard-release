'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages


// Utilities
const myGit = require(path.join(__dirname, 'myGit'));
const tools = require(path.join(__dirname, 'tools'));
const config = require(path.join(__dirname, 'config'));

const UNRELEASE = /^##\s+\[Unreleased\]\s*$/;
const RELEASE = /^##\s+([0-9]{4}-[0-9]{2}-[0-9]{2}\s+([0-9]{2}:[0-9]{2}:[0-9]{2}\s+([\s+-])*[0-9]{4}\s+)*)*Release\s+\[([a-zA-Z0-9\+\.-]+)\].+$/;

const GROUPS = config.usrChangelogHooks();

const GROUPS_REG = new RegExp('^###\\s+(\\W)\\s+([a-zA-Z]+)$');
const SPANID_REG = new RegExp('^<span\\s+id\\s+=\\s+"v_([a-zA-Z]+)_([0-9]+)"></span>$');

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
      const ma = line.match(SPANID_REG);
      if(ma) {
        if(ma[1] == rule.name) {
          flag = true;
          skip = true; // skip: <span id = ...
        } else {
          flag = false;
        }
      }

      const mb = line.match(GROUPS_REG);
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
      const ma = line.match(SPANID_REG);
      if(ma) {
        if(ma[1] == rule.name) {
          flag = true;
          skip = true; // skip: <span id = ...
        } else {
          flag = false;
          unknown = { name: ma[1].trim(), symbol: '' };
        }
      }

      const mb = line.match(GROUPS_REG);
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
      lastVersion = line.replace(RELEASE, '$4');
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
function navigationUrl(key, timesid, symbol) {
  if(timesid) {
    return "[" + "[" + symbol + "]" + "(#v_" + key + '_' + timesid + ")" + "]";
  } else {
    return "[" + "[" + symbol + "]" + "(#v_" + key + ")" + "]";
  }
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
    if(data.length == 0) {
      data.push('');
      data.push('');
      data.push('### ' + unreleaseLogs[key].symbol + ' ' + key);
    } else if(data[0] !== '') {
      data.unshift('');
      data.unshift(''); // add two new line
    }
    if(isKnownGroup(key)) {
      const logs = rawLogs.rawData[key];
      if(logs.length > 0) {
        logs.forEach(function(line, index) {
          let hasIssueMsg = line.split('\n');
          const topMsg = hasIssueMsg.shift();

          // check if has CLOSE/KNOWN ISSUE/BREAKING CHANGES
          if(hasIssueMsg.length != 0) {
            hasIssueMsg = hasIssueMsg.join('\n');
          } else {
            hasIssueMsg = null;
          }

          const msgHp = /^(\w+)(?:\(([^\)\s]+)\))?:\s+(.+)$/;
          const match = msgHp.exec(topMsg);
          let type = match[1];
          let scope = match[2];
          let subject = match[3];
          let tmsg = '- **' + type + '**';

          if(scope) {
            data.push(tmsg + '(`' + scope + '`)' + ': ' + subject);
          } else {
            data.push(tmsg + ': ' + subject);
          }

          if(hasIssueMsg) {
            data.push(hasIssueMsg);
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
        data.shift();
        data.shift(); // remove two new line
        data.unshift(spanId); // add span ID
        data.unshift('');
        data.unshift(''); // add two new line again

        if(data.length > 4) { // two empty line, span id, header
          // add nav info if the section has valid logs data
          symbolList.push(navigationUrl(key, timestamp, symbol));
        }
      }
    }

    if(data.length > minLineCnt) {
      // if only group and span ID, just skip
      unreleaseLogs[key].data = data;
    } else {
      if(isRelease) {
        // remove the group if no log data
        data.splice(key, 1);
      }
    }
  }

  if(symbolList.length > 0) {
    symbolList.unshift('');
    symbolList.unshift('');
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
  '',
  '',
  ''
];

function syncRepoRawLogs(helper, newVer, oldVer, rawLogs, changelog) {
  let maxIncType = 'prerelease';
  if(rawLogs.incType.isMajor) {
    maxIncType = 'major';
  } else if(rawLogs.incType.isMinor) {
    maxIncType = 'minor';
  } else if(rawLogs.incType.isPatch) {
    maxIncType = 'patch';
  }

  let isRelease = false;
  const topHash = myGit.repoHeadHash();
  const prevTopId = '<span id = "PrevTopHash=' + topHash + '_' + maxIncType + '"></span>\n';
  let title = prevTopId + '## [Unreleased]';

  if(helper.cmdArgs.changelogRelease) {
    title =  '## ';
    isRelease = true;

    // Release prefix timestamp
    if(helper.cmdArgs.changelogTimestamp) {
      const timestamp = tools.getTimestamp("YYYY-MM-DD");
      title = title + timestamp + ' ';
    }

    if(rawLogs.repoUrl.release) {
      title =  title + 'Release ' + '[' + newVer + ']';
      title = title + '(' + rawLogs.repoUrl.release + '/' + newVer + ')';
    } else {
      title =  title + 'Release ' + newVer;
    }
  } else {
    // if not release, keep all unknown groups
    helper.cmdArgs.changelogGreed = true;
  }

  const history = runChangelogParser(changelog);
  const unrelease = groupUnreleaseLines(history.U, helper);

  // new generated changelog message
  const changelogA = HeaderMsg.join('\n') + title;
  const logs = mergeRawLogs(rawLogs, unrelease, isRelease);
  helper.debugMsg("Changelog Merge Raw Logs", logs.data);
  helper.debugMsg("Changelog Merge Raw Nvai", logs.navi);

  let changelogC = '';
  for(var key in logs.data) {
    const array = logs.data[key].data;
    let minLineCnt = 3; // two empty line, header
    if(isRelease) minLineCnt = 4; // two empty line, span id, header
    if(array.length > minLineCnt) {
      changelogC = changelogC + array.join('\n');
    }
  }

  let changelogB = '';
  if(isRelease && logs.navi) {
    changelogB = logs.navi.join('\n');
    if(oldVer) {
      let URL = rawLogs.repoUrl.compare + '/' + oldVer + '...' + newVer;
      const cmpMsg = 'comparing with [' + oldVer + '](' + URL + ')';
      changelogB = changelogB + '\n' + cmpMsg;
    }
  }

  // old changelog message
  let changelogD = '';
  helper.debugMsg("Changelog Release Logs", history.R);
  if(history.R.length > 0) {
    changelogD = '\n\n' + history.R.join('\n');
  }

  const changelogSwap = changelog + '.swap'; // changelog swap file
  try {
    helper.tryCreate(changelogSwap, null,
      changelogA + changelogB + changelogC + changelogD);
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
  const head = HeaderMsg.join('\n');
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

exports.initChangelog = writeUnrelease;
exports.insertUnrelease = insertUnrelease;
exports.syncRepoRawLogs = syncRepoRawLogs;
