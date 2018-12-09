'use strict';

function failOnWarnings(cfgRules) {
    try {
        return cfgRules.header.failOnWarn;
    } catch(err) {
        return false;
    }
}

function getHeaderMsgMaxLength(cfgRules) {
    try {
        return cfgRules.header.maxLength || 80;
    } catch(err) {
        return 80;
    }
}

function getHeaderTypes(cfgRules) {
    try {
        const types = cfgRules.header.type;
        if(types instanceof Array) {
            return types;
        } else {
            return null;
        }
    } catch(err) {
        return null;
    }
}

function getScopeValidateCallback(cfgRules, helper) {
    if(!helper.isDefautConfig()) {
        try {
            const callback = cfgRules.header.scope;
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

function getsubjectValidateCallback(cfgRules, helper) {
    if(!helper.isDefautConfig()) {
        try {
            const callback = cfgRules.header.subject;
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

function getBodyValidateCallback(cfgRules, helper) {
    if(!helper.isDefautConfig()) {
        try {
            const callback = cfgRules.body;
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

function getFooterValidateCallback(cfgRules, helper) {
    if(!helper.isDefautConfig()) {
        try {
            const callback = cfgRules.footer;
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
