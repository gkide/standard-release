'use strict';

// Native
const fs = require('fs');
const util = require('util');
const path = require('path');

// Utilities
const tools = require(path.join(__dirname, 'tools'));
const config = require(path.join(__dirname, 'config'));
const myCommit = require(path.join(__dirname, 'myCommit'));
const commitRules = require(path.join(__dirname, 'commitHooks'));

const FOOTER = {
  CLOSE: /^\[CLOSE(#\d+)*\]([\s\t]+)*.*/,
  ISSUE: /^\[KNOWN\s+ISSUE(#\d+)*\]([\s\t]+)*.*/,
  BREAKING: /^\[BREAKING\s+CHANGES(#\d+)*\]([\s\t]+)*.*/
};

function validateMsg(helper, commitMsg) {
  let commit = {};
  if(commitMsg) {
    commit = myCommit.parseCommitFromMsg(helper, commitMsg);
  } else {
    commit = myCommit.parseCommitFromCmdArgs(helper);
  }

  function autoFixMsg(type, oldVal, newVal) {
    let imsg = 'Autofix <' + helper.colorKeys('blue', { [type]: true }) + '>';
    imsg = imsg + ': ' + helper.colorKeys('yellow', { [oldVal]: true }) + ' => ';
    helper.infoMsg(imsg + helper.colorKeys('green', { [newVal]: true }));
  }

  function errorMsgColor(perfixMsg, key, suffixMsg) {
    const keyMsg = '<' + helper.colorKeys('blue', { [key]: true }) + '>';
    helper.errorMsg(perfixMsg + keyMsg + suffixMsg);
  }

  let hasWarnings = false;
  const colorKeys = helper.colorKeys;
  const msgRules = config.usrCommitHooks();

  let isUsrRules = false;
  if(config.hasUsrCommitHooks()) {
    isUsrRules = true;
  }

  if(!commit.headerMsg) {
    errorMsgColor('Aborting commit due to empty ', 'header', ' message.');
    return false;
  }

  if(/^Merge /.test(commit.headerMsg)) {
    helper.infoMsg('Merge commit detected, skip.');
    return true;
  }

  // header length checking
  const headerMaxLength = commitRules.getHeaderMsgMaxLength(msgRules);
  if(commit.headerMsg.length > headerMaxLength && !commit.headerObj.autosquash) {
    const emsg = util.format("Header is longer than %d chars", headerMaxLength);
    helper.errorMsg(emsg);
  }

  const htSkip = {};
  const htRules = {};
  const htFilter = commitRules.headerTypes(msgRules);
  if(!htFilter) {
    errorMsgColor('Commit rules ', 'header.type', ' abnormal, aborting.');
  }
  htFilter.forEach(function(item, idex) {
    if(item.skip) {
      htSkip[item.name] = true;
    } else {
      htRules[item.name] = true;
    }
  });

  helper.debugMsg("Validate Header Types(Skip)", htSkip);
  helper.debugMsg("Validate Header Types(Rule)", htRules);

  let hType = commit.headerObj.type;
  let hScope = commit.headerObj.scope;
  let hSubject = commit.headerObj.subject;
  let bodyMsg = commit.bodyMsg;
  let footerMsg = commit.footerMsg;

  // header:type
  if(!hType) {
    errorMsgColor('Commit message ', 'header.type', ' empty, aborting.');
  }

  if(htSkip[hType]) {
    const imsg = 'Commit message validation ignored for ';
    helper.infoMsg(imsg + colorKeys('blue', htSkip));
    return true;
  }

  if(!isUsrRules && helper.hasUpper(hType)) {
    const old = hType;
    hType = hType.toLowerCase();
    autoFixMsg('type', old, hType);
  }
  if(tools.objLength(htRules) && !htRules[hType]) {
    // for pretty commit header type error message
    const semTyps = {
      major: { group: [], type: [] },
      minor: { group: [], type: [] },
      patch: { group: [], type: [] },
      tweak: { group: [], type: [] },
      none:  { group: [], type: [] }
    };

    let typRules = msgRules.header.type;
    let logRules = config.usrChangelogHooks();

    logRules.forEach(function(obj) {
      const data = semTyps[obj.semver];
      if(data) {
        data.group.push(obj.name);
      }
    });

    typRules.forEach(function(obj) {
      const xT = obj.name;
      const xG = obj.isFilter;
      if(typeof(xT) == 'string' && typeof(xG) == 'string') {
        if(-1 != semTyps.major.group.indexOf(xG)) {
          semTyps.major.type.push(xT);
        } else if(-1 != semTyps.minor.group.indexOf(xG)) {
          semTyps.minor.type.push(xT);
        } else if(-1 != semTyps.patch.group.indexOf(xG)) {
          semTyps.patch.type.push(xT);
        } else if(-1 != semTyps.tweak.group.indexOf(xG)) {
          semTyps.tweak.type.push(xT);
        } else if(-1 != semTyps.none.group.indexOf(xG)) {
          semTyps.none.type.push(xT);
        }
      } else {
        semTyps.none.type.push(xT);
      }
    });

    if(semTyps.major.type.length > 0 ) {
      let message = 'Major Types: ';
      semTyps.major.type.forEach(function(type, index) {
        message += helper.colorKeys('green', { [type]: true })
        if(semTyps.major.type.length > index + 1) message += ', '
      });
      helper.infoMsg(message, true);
    }
    if(semTyps.minor.type.length > 0 ) {
      let message = 'Minor Types: ';
      semTyps.minor.type.forEach(function(type, index) {
        message += helper.colorKeys('green', { [type]: true })
        if(semTyps.minor.type.length > index + 1) message += ', '
      });
      helper.infoMsg(message, true);
    }
    if(semTyps.patch.type.length > 0 ) {
      let message = 'Patch Types: ';
      semTyps.patch.type.forEach(function(type, index) {
        message += helper.colorKeys('green', { [type]: true })
        if(semTyps.patch.type.length > index + 1) message += ', '
      });
      helper.infoMsg(message, true);
    }
    if(semTyps.tweak.type.length > 0 ) {
      let message = 'Tweak Types: ';
      semTyps.tweak.type.forEach(function(type, index) {
        message += helper.colorKeys('green', { [type]: true })
        if(semTyps.tweak.type.length > index + 1) message += ', '
      });
      helper.infoMsg(message, true);
    }
    if(semTyps.none.type.length > 0 ) {
      let message = 'NLogs Types: ';
      semTyps.none.type.forEach(function(type, index) {
        message += helper.colorKeys('green', { [type]: true })
        if(semTyps.none.type.length > index + 1) message += ', '
      });
      helper.infoMsg(message, true);
    }
    const keyMsg = helper.colorKeys('blue', { [hType]: true });
    helper.errorMsg(keyMsg +' is not one of the above valid commit types.');
  }

  let checkObj
  let checkResult

  // header:scope
  checkObj = commitRules.headerScopeCallback(msgRules, helper);

  if(!checkObj) {
    errorMsgColor('Commit rules ', 'header.scope', ' abnormal, aborting.');
  }

  if(checkObj.isDefault) {
    // Rules: one word, can be empty, all lower case
    if(helper.hasUpper(hScope)) {
      const fixed = hScope.toLowerCase();
      autoFixMsg('scope', hScope, fixed);
      checkResult = { ok: true , autofix: fixed };
    } else {
      checkResult = { ok: true };
    }
  } else {
    checkResult = checkObj.callback(hScope);
  }

  helper.debugMsg("Validate Header Scope", checkResult);
  if(!checkResult.ok) {
    errorMsgColor('', 'scope', ' invalid because ' + checkResult.emsg);
  }

  if(checkResult.autofix) {
    hasWarnings = true;
    hScope = checkResult.autofix;
  }

  // header:subject
  checkObj = commitRules.headerSubjectCallback(msgRules, helper);

  if(!checkObj) {
    errorMsgColor('Commit rules ', 'header.subject', ' abnormal, aborting.');
  }

  if(checkObj.isDefault) {
    // Rules: lower-case-started, no empty, no ending with dot(.)
    if(!hSubject) {
      errorMsgColor('', 'subject', ' is empty.');
    }

    if(/\.([\s]*\n*)$/g.test(hSubject)) {
      errorMsgColor('', 'subject', ' ending with dot(.)');
    }

    if(helper.isCharUpper(hSubject.charAt(0))) {
      const fixed = helper.lowerCaseFirst(hSubject);
      autoFixMsg('subject', hSubject, fixed);
      checkResult = { ok: true , autofix: fixed };
    } else {
      checkResult = { ok: true };
    }
  } else {
    checkResult = checkObj.callback(hSubject);
  }

  helper.debugMsg("Validate Header Subject", checkResult);
  if(!checkResult.ok) {
    errorMsgColor('', 'subject', ' invalid because ' + checkResult.emsg);
  }

  if(checkResult.autofix) {
    hasWarnings = true;
    hSubject = checkResult.autofix;
  }

  // body
  checkObj = commitRules.bodyCallback(msgRules, helper);

  if(!checkObj) {
    errorMsgColor('Commit rules ', 'body', ' abnormal, aborting.');
  }

  if(checkObj.isDefault) {
    // Rules: can be anything, including empty
    checkResult = { ok: true };
  } else {
    checkResult = checkObj.callback(bodyMsg);
  }

  helper.debugMsg("Validate Header Body", checkResult);
  if(!checkResult.ok) {
    errorMsgColor('', 'body', ' invalid because ' + checkResult.emsg);
  }

  if(checkResult.autofix) {
    hasWarnings = true;
    bodyMsg = checkResult.autofix;
  }

  // footer
  checkObj = commitRules.footerCallback(msgRules, helper);

  if(!checkObj) {
    errorMsgColor('Commit rules ', 'footer', ' abnormal, aborting.');
  }

  if(checkObj.isDefault) {
    function checkFooterMsg(footerMsg) {
      if(!footerMsg) {
        return { ok: true };
      }

      let isOK = true;
      let hasClose = false;
      let hasKnownIssue = false;
      let hasBreakingChanges = false;

      footerMsg = footerMsg.split(myCommit.newLine);
      // default: if not empty, should be one of
      footerMsg.forEach(function(data) {
        // [CLOSE] ...
        if(!hasClose && FOOTER.CLOSE.test(data)) {
          hasClose = true;
        }

        // [KNOWN ISSUE] ...
        if(!hasKnownIssue && FOOTER.ISSUE.test(data)) {
          hasKnownIssue = true;
        }

        // [BREAKING CHANGES] ...
        if(!hasBreakingChanges && FOOTER.BREAKING.test(data)) {
          hasBreakingChanges = true;
        }

        let doSkip = false;
        if(/^Signed-off-by:\s*/.test(data)) {
          doSkip = true;
        }

        if(!hasClose && !hasKnownIssue && !hasBreakingChanges) {
          if(!doSkip) {
            isOK = false;
          }
        }
      });

      if(isOK) {
        return { ok: true };
      } else {
        const emsg = 'not one of:\n[CLOSE] ... or [CLOSE#XXX] ...\n'
          + '[KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...\n'
          + '[BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...';
        return { ok: false, emsg: emsg };
      }
    }

    if(footerMsg) {
      let msgArray = footerMsg.split(myCommit.newLine);
      msgArray = msgArray.filter(function(data) {
        if(/^\s*$/.test(data) || !data) {
          return false;
        } else {
          return true;
        }
      });
      footerMsg = msgArray.join(myCommit.newLine);
    }

    checkResult = checkFooterMsg(footerMsg);
  } else {
    checkResult = checkObj.callback(footerMsg);
  }

  helper.debugMsg("Validate Header Footer", checkResult);
  if(!checkResult.ok) {
    errorMsgColor('', 'footer', ' invalid because ' + checkResult.emsg);
  }

  if(checkResult.autofix) {
    hasWarnings = true;
    footerMsg = checkResult.autofix;
  }

  if(commit.file && !commit.headerObj.autosquash) {
    let fixedMsg
    let sync = false;

    if(hScope) {
      fixedMsg = hType + '(' + hScope + '): ' + hSubject;
    } else {
      fixedMsg = hType + ': ' + hSubject;
    }

    if(commit.headerMsg !== fixedMsg) {
      sync = true;
    }

    if(commit.bodyMsg) {
      if(commit.bodyMsg !== bodyMsg) {
        sync = true;
        fixedMsg = fixedMsg + myCommit.HBFSepator + bodyMsg;
      } else {
        fixedMsg = fixedMsg + myCommit.HBFSepator + commit.bodyMsg;
      }
    }

    if(commit.footerMsg) {
      if(commit.footerMsg !== footerMsg) {
        sync = true;
        fixedMsg = fixedMsg + myCommit.HBFSepator + footerMsg;
      } else {
        fixedMsg = fixedMsg + myCommit.HBFSepator + commit.footerMsg;
      }
    }

    if(sync) {
      fs.writeFileSync(commit.file, fixedMsg);
    }
  }

  if(commitRules.failOnAutoFix(msgRules, helper) && hasWarnings) {
    helper.errorMsg("Abort for fail on warnings");
    return false;
  }

  return true;
};

exports.FOOTER = FOOTER;
exports.validateMsg = validateMsg;
