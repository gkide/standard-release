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

const createCallback = (resolve, reject) => (err, data) => {
    if(err) reject(err);
    else resolve(data);
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

function isUrl(string) {
    const MATCH_URL = /^https?:\/\/.+/
    if(MATCH_URL.test(string)) {
        return true;
    } else {
        return false;
    }
}

function hasFile(fileName) {
    try {
        fs.accessSync(fileName, fs.constants.R_OK);
        return true;
    } catch(err) {
        return false;
    }
}

function readFile(filePath) {
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

function writeFile(filePath, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, createCallback(resolve, reject));
    })
}

function readJSON(filePath) {
    return JSON.parse(readFile(filePath));
}

exports.objLength = objLength;
exports.getModule = getModule;

exports.isUrl = isUrl;
exports.hasFile = hasFile;
exports.readFile = readFile;
exports.readJSON = readJSON;
exports.writeFile = writeFile;
