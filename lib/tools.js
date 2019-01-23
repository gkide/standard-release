'use strict';

// Native
const fs = require('fs');
const path = require('path');

const getModule = function(name) {
    return require(path.join(__dirname, name));
}

const bufferToString = function(buffer) {
    let hasToString = buffer && typeof(buffer.toString) === 'function';
    return hasToString && buffer.toString();
}

const getFileContent = function(filePath) {
    try {
        let buffer = fs.readFileSync(filePath);
        return bufferToString(buffer);
    } catch(err) {
        // Ignore these error types because it is most likely 
        // validating a commit from a text instead of a file
        if(err && err.code !== 'ENOENT' && err.code !== 'ENAMETOOLONG') {
            throw err;
        }
    }
}

function objLength(obj) {
    const type = typeof obj;
    if(type == 'string') {
        return obj.length;
    } else if(type == 'object') {
        let cnt = 0;
        for(let i in obj) {
            cnt++;
        }
        return cnt;
    }
    return false;
}

exports.objLength = objLength;
exports.getModule = getModule;
exports.getFileContent = getFileContent;
