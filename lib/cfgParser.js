'use strict';

function failOnWarnings(commitRules, helper) {
    if(!helper.isDefautConfig()) {
        try {
            return commitRules.failOnWarn;
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

function getScopeValidateCallback(commitRules, helper) {
    if(!helper.isDefautConfig()) {
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

function getsubjectValidateCallback(commitRules, helper) {
    if(!helper.isDefautConfig()) {
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

function getBodyValidateCallback(commitRules, helper) {
    if(!helper.isDefautConfig()) {
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

function getFooterValidateCallback(commitRules, helper) {
    if(!helper.isDefautConfig()) {
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

exports.failOnWarnings = failOnWarnings;
exports.getHeaderMsgMaxLength = getHeaderMsgMaxLength;
exports.getHeaderTypes = getHeaderTypes;
exports.getScopeValidateCallback = getScopeValidateCallback;
exports.getsubjectValidateCallback = getsubjectValidateCallback;
exports.getBodyValidateCallback = getBodyValidateCallback;
exports.getFooterValidateCallback = getFooterValidateCallback;
