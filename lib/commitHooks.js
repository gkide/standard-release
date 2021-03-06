'use strict';

// Native
const path = require('path');

// Packages
const config = require(path.join(__dirname, 'config'));

const hasUsrHooks = config.hasUsrCommitHooks();

function failOnAutoFix(commitRules, helper) {
  if(hasUsrHooks) {
    try {
      return commitRules.failOnAutoFix;
    } catch(err) {
      return false;
    }
  }

  return true;
}

function getHeaderMsgMaxLength(commitRules) {
  try {
    return commitRules.header.maxLength || 80;
  } catch(err) {
    return 80;
  }
}

function getHeaderTypes(commitRules) {
  try {
    const types = commitRules.header.type;
    if(types instanceof Array) {
      return types;
    } else {
      return null;
    }
  } catch(err) {
    return null;
  }
}

function getHeaderScopeCallback(commitRules, helper) {
  if(hasUsrHooks) {
    try {
      const callback = commitRules.header.scope;
      if(typeof(callback) == 'function') {
        return { callback: callback, isDefault: false };
      } else {
        return null;
      }
    } catch(err) {
      return null;
    }
  }

  return { isDefault: true };
}

function getHeaderSubjectCallback(commitRules, helper) {
  if(hasUsrHooks) {
    try {
      const callback = commitRules.header.subject;
      if(typeof(callback) == 'function') {
        return { callback: callback, isDefault: false };
      } else {
        return null;
      }
    } catch(err) {
      return null;
    }
  }

  return { isDefault: true };
}

function getBodyCallback(commitRules, helper) {
  if(hasUsrHooks) {
    try {
      const callback = commitRules.body;
      if(typeof(callback) == 'function') {
        return { callback: callback, isDefault: false };
      } else {
        return null;
      }
    } catch(err) {
      return null;
    }
  }

  return { isDefault: true };
}

function getFooterCallback(commitRules, helper) {
  if(hasUsrHooks) {
    try {
      const callback = commitRules.footer;
      if(typeof(callback) == 'function') {
        return { callback: callback, isDefault: false };
      } else {
        return null;
      }
    } catch(err) {
      return null;
    }
  }

  return { isDefault: true };
}

exports.failOnAutoFix = failOnAutoFix;
exports.getHeaderMsgMaxLength = getHeaderMsgMaxLength;

exports.headerTypes = getHeaderTypes;
exports.headerScopeCallback = getHeaderScopeCallback;
exports.headerSubjectCallback = getHeaderSubjectCallback;
exports.bodyCallback = getBodyCallback;
exports.footerCallback = getFooterCallback;
