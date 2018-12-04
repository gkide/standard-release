'use strict';

var fs = require('fs');
var util = require('util');
var semverRegex = require('semver-regex');

var getConfig = require('./usrCfg').getConfig;

var config = getConfig();

// fixup! and squash! are part of Git, commits tagged with them are not intended to be merged, cf. https://git-scm.com/docs/git-commit
var PATTERN = /^((fixup! |squash! )?(\w+)(?:\(([^\)\s]+)\))?: (.+))(?:\n|$)/;

var error = function() {
  // gitx does not display it
  // http://gitx.lighthouseapp.com/projects/17830/tickets/294-feature-display-hook-error-message-when-hook-fails
  // https://groups.google.com/group/gitx/browse_thread/thread/a03bcab60844b812
  console[config.warnOnFail ? 'warn' : 'error']('INVALID COMMIT MSG: ' + util.format.apply(null, arguments));
};

function showMsgRules(msgRules) {
    console.debug('typeAny: ' + msgRules.typeAny);
    console.debug('typeIgnore: ' + msgRules.typeIgnore);
    console.debug('typeMixedCase: ' + msgRules.typeMixedCase);
    console.debug('headerMaxLength: ' + msgRules.headerMaxLength);
    msgRules.type.forEach(function(item, idex) {
        try {
                console.debug('['+item.name+']: '+item.skip+', '+item.isFilter);
        } catch(err) {
            console.debug("Config file error: 'commitRules'");
            process.exit(1);
        }
    })
    if(typeof(msgRules.scope) == 'function') {
        msgRules.scope('This is scope');
    }
    if(typeof(msgRules.subject) == 'function') {
        msgRules.subject('This is subject');
    }
    if(typeof(msgRules.body) == 'function') {
        msgRules.body('This is body');
    }
    if(typeof(msgRules.footer) == 'function') {
        msgRules.footer('This is footer');
    }
}

exports.config = config;
exports.validateMsg = function(helper, msgData, msgFile) {
    const msgRules = helper.getUsrConfig(helper.cfgSym.usrCfgCommitRules);
    // showMsgRules(msgRules);

    const AUTO_FIX = config.autoFix && msgFile;
    const headerMaxLength = msgRules.headerMaxLength || 80;

    var types = config.types = config.types || 'conventional-commit-types';
    if(typeof types === 'string' && types !== '*') {
        types = Object.keys(require(types).types);
    }

    const msgHeaderBodyFooter = (msgData || '').split('\n').filter(function(str) {
        return str.indexOf('#') !== 0; // skip lines started by #
    }).join('\n');

    const msgHeader = msgHeaderBodyFooter.split('\n').shift();

    if(msgHeader === '') {
        helper.errorMsg('Aborting commit due to empty commit message.');
        return false;
    }

    let isValid = true;
    const MERGE_COMMIT = /^Merge /;
    if(MERGE_COMMIT.test(msgHeader)) {
        helper.infoMsg('Merge commit detected.', helper.cmdArgs.silent);
        return true;
    }

    const IGNORED = new RegExp(util.format('(^WIP)|(^%s$)', semverRegex().source));
    if(IGNORED.test(msgHeader)) {
        console.log('Commit message validation ignored.');
        return true;
    }

console.log("-----------------------------");
console.log(IGNORED);
console.log("-----------------------------");

  var match = PATTERN.exec(msgHeader);

  if (!match) {
    error('does not match "<type>(<scope>): <subject>" !');
    isValid = false;
  } else {
    var firstLine = match[1];
    var squashing = !!match[2];
    var type = match[3];
    var scope = match[4];
    var subject = match[5];

    var SUBJECT_PATTERN = new RegExp(config.subjectPattern || '.+');
    var SUBJECT_PATTERN_ERROR_MSG = config.subjectPatternErrorMsg || 'subject does not match subject pattern!';

    if (firstLine.length > headerMaxLength && !squashing) {
      error('is longer than %d characters !', headerMaxLength);
      isValid = false;
    }

    if (AUTO_FIX) {
      type = lowercase(type);
    }

    if (types !== '*' && types.indexOf(type) === -1) {
      error('"%s" is not allowed type ! Valid types are: %s', type, types.join(', '));
      isValid = false;
    }

    isValid = validateScope(isValid, scope);

    if (AUTO_FIX) {
      subject = lowercaseFirstLetter(subject);
    }

    if (!SUBJECT_PATTERN.exec(subject)) {
      error(SUBJECT_PATTERN_ERROR_MSG);
      isValid = false;
    }
  }

  // Some more ideas, do want anything like this ?
  // - Validate the rest of the message (body, footer, BREAKING CHANGE annotations)
  // - auto add empty line after subject ?
  // - auto remove empty () ?
  // - auto correct typos in type ?
  // - store incorrect messages, so that we can learn

  isValid = isValid || config.warnOnFail;

  if (isValid) { // exit early and skip messaging logics
    if (AUTO_FIX && !squashing) {
      var scopeFixed = scope ? '(' + scope + ')' : '';
      var firstLineFixed = type + scopeFixed + ': ' + subject;

      if (firstLine !== firstLineFixed) {
        var rawFixed = msgData.replace(firstLine, firstLineFixed);
        fs.writeFileSync(msgFile, rawFixed);
      }
    }

    return true;
  }

  var argInHelp = config.helpMessage && config.helpMessage.indexOf('%s') !== -1;

  if (argInHelp) {
    console.log(config.helpMessage, msgHeaderBodyFooter);
  } else if (msgHeader) {
    console.log(msgHeader);
  }

  if (!argInHelp && config.helpMessage) {
    console.log(config.helpMessage);
  }

  return false;
};

function lowercase(string) {
  return string.toLowerCase();
}

function lowercaseFirstLetter(string) {
  return lowercase(string.charAt(0)) + string.slice(1);
}

function validateScope(isValid, scope) {
  config.scope = config.scope || {};
  var validateScopes = config.scope.validate || false;
  var multipleScopesAllowed = config.scope.multiple || false;
  var allowedScopes = config.scope.allowed || '*';
  var scopeRequired = config.scope.required || false;
  var scopes = scope ? scope.split(',') : [];

  function validateIndividualScope(item) {
    if (allowedScopes[0].trim() === '*') {
      return;
    }
    if (allowedScopes.indexOf(item) === -1) {
      error('"%s" is not an allowed scope ! Valid scope are: %s', item, allowedScopes.join(', '));
      isValid = false;
    }
  }

  if (validateScopes) {
    if (scopeRequired && scopes.length === 0) {
      error('a scope is required !');
      isValid = false;
    }
    // If scope is not provided, we ignore the rest of the testing and do early
    // return here.
    if (scopes.length === 0) {
      return isValid;
    }
    if (isValid && multipleScopesAllowed) {
      scopes.forEach(validateIndividualScope);
    }
    if (isValid && !multipleScopesAllowed) {
      if (scopes.length > 1) {
        error('only one scope can be provided !');
        isValid = false;
      }
      if (isValid) {
        validateIndividualScope(scopes[0]);
      }
    }
  }

  return isValid;
};
