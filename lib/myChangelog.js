'use strict';

// Native
const fs = require('fs');
const util = require('util');
const path = require('path');

// Packages
const semver = require('semver');

// Utilities
const tools = require(path.join(__dirname, 'tools'));
const myGit = require(path.join(__dirname, 'myGit'));
const config = require(path.join(__dirname, 'config'));
const mySemVer = require(path.join(__dirname, 'mySemVer'));
const myCommit = require(path.join(__dirname, 'myCommit'));
const commitRules = require(path.join(__dirname, 'commitHooks'));
const template = require(path.join(__dirname, 'template'));
const FOOTER = require(path.join(__dirname, 'validateMsg')).FOOTER;

function getRawFilter(helper) {
  const rawFilter = {};
  const msgRules = config.usrCommitHooks();
  const htFilter = commitRules.headerTypes(msgRules);

  if(!htFilter) {
    helper.errorMsg('Commit rules header.type abnormal, aborting.');
  }

  htFilter.forEach(function(item, idex) {
    if(!item.skip && typeof item.isFilter == 'string') {
      rawFilter[item.name] = item.isFilter;
    }
  });

  return rawFilter;
}

function arrHasVal(array, value) {
  let isFound = false;
  array.forEach(function(data) {
    if(data == value) {
      isFound = true;
    }
  });
  return isFound;
}

function gihubUrls(httpsUrl) {
  let urls = {
    commit: null,
    issues: null,
    release: null,
  };

  if(httpsUrl) {
    if(httpsUrl.slice(-4) == '.git') {
      httpsUrl = httpsUrl.slice(0, -4);
    }
    urls.commit = httpsUrl + '/commit';
    urls.issues = httpsUrl + '/issues';
    urls.compare = httpsUrl + '/compare';
    urls.release = httpsUrl + '/releases/tag';
  }

  return urls;
}

function isSHA1(tagSha1) {
  if(/^[a-fA-F0-9]+$/g.test(tagSha1)) {
    return true;
  }
  return false;
}

function footerFilter(msg) {
  const footer = {
    close: [],
    issue: [],
    breaking: []
  };

  const NUMBERS = /^#(\d+)([^\d]+)*/;
  const footerMsg = msg.split(myCommit.newLine);
  footerMsg.forEach(function(data) {
    // [CLOSE] ...
    if(FOOTER.CLOSE.test(data)) {
      const nums = data.replace(FOOTER.CLOSE, '$1');
      if(NUMBERS.test(nums)) {
        footer.close.push(nums.replace(NUMBERS, '$1'));
      }
    }

    // [KNOWN ISSUE] ...
    if(FOOTER.ISSUE.test(data)) {
      const nums = data.replace(FOOTER.ISSUE, '$1');
      if(NUMBERS.test(nums)) {
        footer.issue.push(nums.replace(NUMBERS, '$1'));
      }
    }

    // [BREAKING CHANGES] ...
    if(FOOTER.BREAKING.test(data)) {
      const nums = data.replace(FOOTER.BREAKING, '$1');
      if(NUMBERS.test(nums)) {
        footer.breaking.push(nums.replace(NUMBERS, '$1'));
      }
    }
  });

  return footer;
}

function runRawFilter(helper, repoUrl, startPoint, rawFilter, prevTopHash) {
  const usrRules = { // changelog rules
    major: { group: [], keys: [] },
    minor: { group: [], keys: [] },
    patch: { group: [], keys: [] },
    tweak: { group: [], keys: [] }
  };
  const changelogRules = config.usrChangelogHooks();
  changelogRules.forEach(function(data) {
    if(data.skip) {
      return;
    }
    switch(data.semver) {
    case 'major':
      usrRules.major.group.push(data.name);
      break;
    case 'minor':
      usrRules.minor.group.push(data.name);
      break;
    case 'patch':
      usrRules.patch.group.push(data.name);
      break;
    case 'tweak':
      usrRules.tweak.group.push(data.name);
      break;
    }
  })

  const rawData = {}; // raw commit data
  for(const key in rawFilter) {
    const group = rawFilter[key]; // group name
    rawData[group] = []; // header type
    if(arrHasVal(usrRules.major.group, group)) {
      usrRules.major.keys.push(key);
    } else if(arrHasVal(usrRules.minor.group, group)) {
      usrRules.minor.keys.push(key);
    } else if(arrHasVal(usrRules.patch.group, group)) {
      usrRules.patch.keys.push(key);
    } else if(arrHasVal(usrRules.tweak.group, group)) {
      usrRules.tweak.keys.push(key);
    }
  }

  const urls = gihubUrls(repoUrl); // repo remote URLs
  const incType = { // raw increment type
    isMajor: false, isMinor: false, isPatch: false, isTweak: true
  };

  let isSkipAllRawLogs = false;
  if(helper.cmdArgs.changelogFrom) {
    if(/^skip$/i.test(helper.cmdArgs.changelogFrom)) {
      isSkipAllRawLogs = true;
    } else {
      // command line log filter start point
      startPoint = helper.cmdArgs.changelogFrom;
      if(!isSHA1(startPoint) && !myGit.repoHasTag(startPoint, helper)) {
        const tag = helper.colorKeys('blue', { [startPoint]: true });
        helper.errorMsg("repo has no tag named " + tag);
      }
    }
  } else {
    if(prevTopHash) {
      // log filter start point parse from changelog
      startPoint = prevTopHash;
      if(!isSHA1(startPoint)) {
        const pth = helper.colorKeys('blue', { [startPoint]: true });
        helper.errorMsg("changelog UNRELEASE is not prev hash " + pth);
      }
    }
    // log filter start point is the previous tag
  }
  helper.debugMsg("Get Raw Logs Start From", startPoint);

  const topHash = myGit.repoHeadHash();
  if(topHash == startPoint) {
    return {
      rawData: rawData,
      incType: incType,
      repoUrl: urls,
      from: startPoint
    };
  }

  let filterOpts = {};
  if(startPoint) {
    filterOpts.from = startPoint;
  }

  myGit.getRawCommits(filterOpts).forEach(function(data, index) {
    const commitRaw = data.split('\n');
    const commitHash = commitRaw[0];
    commitRaw.shift();
    const commitMsg = commitRaw.join('\n');
    const commitData = { data:commitMsg, file:null };

    // Raw commit message
    const rawMsg = myCommit.parseCommitFromMsg(null, commitData, false);

    if(rawMsg.skip) {
      return;
    }
    const what = mySemVer.getIncrement(rawMsg, usrRules);
    if(what.skip) {
      return;
    }
    switch(what.incrementType) {
      case 'major':
        incType.isMajor = true;
        break;
      case 'minor':
        incType.isMinor = true;
        break;
      case 'patch':
        incType.isPatch = true;
        break;
      case 'tweak':
        incType.isTweak = true;
        break;
    }

    const footer = footerFilter(rawMsg.footerMsg);
    const category = rawFilter[rawMsg.headerObj.type];
    if(category) {
      let refUrl = '';
      let refName = '';
      let sha1Refs = '';
      if(commitHash) {
        refName = '[' + commitHash + ']';
      }
      if(urls.commit) {
        refUrl = '(' + urls.commit + '/' + commitHash + ')';
      }
      if(refName && refUrl) {
        sha1Refs = '(' + refName + refUrl + ')';
      }

      let issueRefs = '';
      if(urls.issues) {
        let closeIssue = '';
        if(footer.close.length != 0) {
          footer.close.forEach(function(issueNum) {
            if(closeIssue) {
              closeIssue = closeIssue + ', '
            } else {
              closeIssue = '\n  - CLOSE: ';
            }
            const issueUrl = urls.issues + '/' + issueNum;
            closeIssue = closeIssue + '[#' + issueNum + '](' + issueUrl + ')';
          });
        }

        let knownIssue = '';
        if(footer.issue.length != 0) {
          footer.issue.forEach(function(issueNum) {
            if(knownIssue) {
              knownIssue = knownIssue + ', '
            } else {
              knownIssue = '\n  - KNOWN ISSUE: ';
            }
            const issueUrl = urls.issues + '/' + issueNum;
            knownIssue = knownIssue + '[#' + issueNum + '](' + issueUrl + ')';
          });
        }

        let breakingIssue = '';
        if(footer.breaking.length != 0) {
          footer.breaking.forEach(function(issueNum) {
            if(breakingIssue) {
              breakingIssue = breakingIssue + ', '
            } else {
              breakingIssue = '\n  - BREAKING CHANGES: ';
            }
            const issueUrl = urls.issues + '/' + issueNum;
            breakingIssue = breakingIssue + '[#' + issueNum + '](' + issueUrl + ')';
          });
        }

        issueRefs = closeIssue + knownIssue + breakingIssue;
      }

      let abstract = rawMsg.headerMsg;

      if(sha1Refs) {
        abstract = abstract + ' ' + sha1Refs;
      }

      abstract = abstract.replace(/\n/g, '');

      // Now the 'abstract' has two parts:
      // The first one is:
      //    type(scope): header-message
      // The second one is (optional):
      //    - CLOSE: ...
      //    - KNOWN ISSUE: ...
      //    - BREAKING CHANGES: ...
      //
      // The header has no newline, but the following ones may have
      if(issueRefs) {
        abstract = abstract + issueRefs;
      }

      rawData[category].push(abstract);
    }
  });

  // skip all raw log message from commit history
  if(isSkipAllRawLogs) {
    for(var key in rawData){
      rawData[key].length = 0; // clean logs array
    }
  }

  if(isSHA1(startPoint)) {
    // if git SHA1, then try to use the first 7 char
    startPoint = startPoint.substring(0, 7);
  }

  return {
    rawData: rawData,
    incType: incType,
    repoUrl: urls,
    from: startPoint
  };
}

let maxIncType = "prerelease";
const RegExpPTH = new RegExp('^<span\\s+id\\s+=\\s+"PrevTopHash=([A-Fa-f0-9]*)_([a-z]*)"></span>$');
function getPrevTopHash(changelog, helper) {
  let prevTopHash = "";
  const textData = tools.readFile(changelog);
  const lineData = textData.split('\n');

  lineData.some(function(line, index) {
    if(index >= 8) {
      return true; // skip
    }

    // console.log('[' + index + ']={' + line + '}');
    const ma = line.match(RegExpPTH);
    if(ma) {
      prevTopHash = ma[1];
      maxIncType = ma[2];
      return true; // skip
    }
  });

  // previous update changelog of top head hash
  helper.debugMsg("Previous Top Head Hash", prevTopHash);
  return prevTopHash;
}

function updateChangelog(helper) {
  // changelog file to update
  const changelog = config.getChangelog(helper, helper.cmdArgs.changelog);
  // latest semver tag
  const prevTag = myGit.getLatestTagSync('v');
  // repo remote url of https protocol
  const repoUrl = myGit.getGitRemoteUrlHttps();
  // raw commit message filter
  const rawFilter = getRawFilter(helper);
  // prev top hash for previous changelog update
  const prevTopHash = getPrevTopHash(changelog, helper);
  // get repo history raw log message
  const rawData = runRawFilter(helper, repoUrl, prevTag, rawFilter, prevTopHash);

  // https://github.com/npm/node-semver, one of the following ones:
  // major, premajor, minor, preminor, patch, prepatch, or prerelease
  let incType = 'prerelease';
  if(rawData.incType.isMajor || 'major' == maxIncType) {
    incType = 'major';
    rawData.incType.isMajor = true;
    rawData.incType.isMinor = false;
    rawData.incType.isPatch = false;
    rawData.incType.isTweak = false;
  } else if(rawData.incType.isMinor || 'minor' == maxIncType) {
    incType = 'minor';
    rawData.incType.isMajor = false;
    rawData.incType.isMinor = true;
    rawData.incType.isPatch = false;
    rawData.incType.isTweak = false;
  } else if(rawData.incType.isPatch || 'patch' == maxIncType) {
    incType = 'patch';
    rawData.incType.isMajor = false;
    rawData.incType.isMinor = false;
    rawData.incType.isPatch = true;
    rawData.incType.isTweak = false;
  }

  let oldTag = rawData.from;
  if(isSHA1(oldTag)) {
    oldTag = prevTag;
  }

  helper.debugMsg("Auto SemVer IncType", rawData.incType);
  const newTag = mySemVer.getReleaseTag(incType, prevTag, helper);

  const colorKeys = helper.colorKeys;
  let promptMsg = colorKeys('green', { [newTag]: true });
  helper.infoMsg('Release Tag should be: ' + promptMsg, true);
  return template.syncRepoRawLogs(helper, newTag, oldTag, rawData, changelog);
}

exports.update = updateChangelog;
