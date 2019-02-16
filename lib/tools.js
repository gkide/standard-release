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
    fs.appendFileSync(filePath, data, 'utf8');
}

function readJSON(filePath) {
    return JSON.parse(readFile(filePath));
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date
Date.prototype.MyFormat = function(fmt) {
    // Integer, 1000 ~ 9999
    if(/(Y+)/.test(fmt)) {
        fmt = fmt.replace(/Y+/g, this.getFullYear() + "");
    }
    // Integer, 0 ~ 11
    if(/(M+)/.test(fmt)) {
        let month = this.getMonth() + 1 + "";
        if(/MM/.test(fmt)) {
            if(month.length == 1) {
                month = "0" + month;
            }
        }
        fmt = fmt.replace(/M+/g, month);
    }
    // Integer, 1 ~ 31
    if(/(D+)/.test(fmt)) {
        let date = this.getDate() + "";
        if(/DD/.test(fmt)) {
            if(date.length == 1) {
                date = "0" + date;
            }
        }
        fmt = fmt.replace(/D+/g, date);
    }

    // Integer, 0 ~ 23
    if(/(h+)/.test(fmt)) {
        let hour = this.getHours() + "";
        if(/hh/.test(fmt)) {
            if(hour.length == 1) {
                hour = "0" + hour;
            }
        }
        fmt = fmt.replace(/h+/g, hour);
    }
    // Integer, 0 ~ 59
    if(/(m+)/.test(fmt)) {
        let minute = this.getMinutes() + "";
        if(/mm/.test(fmt)) {
            if(minute.length == 1) {
                minute = "0" + minute;
            }
        }
        fmt = fmt.replace(/m+/g, minute);
    }
    // Integer, 0 ~ 59
    if(/(s+)/.test(fmt)) {
        let second = this.getSeconds() + "";
        if(/ss/.test(fmt)) {
            if(second.length == 1) {
                second = "0" + second;
            }
        }
        fmt = fmt.replace(/s+/g, second);
    }
    // Integer, 0 ~ 999
    if(/(x+)/.test(fmt)) {
        let milliseconds = this.getMilliseconds() + "";
        if(/xxx/.test(fmt)) {
            if(milliseconds.length == 1) {
                milliseconds = "00" + milliseconds;
            } else if(milliseconds.length == 2) {
                milliseconds = "0" + milliseconds;
            }
        } else if(/xx/.test(fmt)) {
            if(milliseconds.length == 1) {
                milliseconds = "0" + milliseconds;
            }
        }
        fmt = fmt.replace(/x+/g, milliseconds);
    }

    // Integer, time zone difference in minutes to UTC
    if(/(Z+)/.test(fmt)) {
        // Locale timezone    UTC-8    UTC    UTC+3
        // Return Value       480      0      -180
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset
        let timezone = this.getTimezoneOffset();

        let sign = "";
        if(timezone < 0) {
            sign = "+"; // local timezone is ahead UTC
            timezone = 0 - timezone;
        } else if(timezone > 0) {
            sign = "-"; // local timezone is behind UTC
        } else {
            // Time Zone Abbreviations Worldwide List
            // https://www.timeanddate.com/time/zones/
            timezone = " 0000"; // ±hhmm
        }

        let diff_h = timezone/60;
        let diff_m = timezone%60;
        if(diff_h < 10) {
            diff_h = "0" + diff_h;
        }
        if(diff_m < 10) {
            diff_m = "0" + diff_m;
        }

        fmt = fmt.replace(/Z+/g, sign + diff_h + diff_m);
    }

    return fmt;
}

// Get current timestamp
// https://en.wikipedia.org/wiki/ISO_8601
// https://www.iso.org/iso-8601-date-and-time-format.html
function getTimestamp(format) {
    if(/^ISO([\s-])*8601$/i.test(format)) {
        format = "YYYY-MM-DD hh:mm:ss ZZZZZ";
    } else {/\//g
        format = format.replace(/y/g, 'Y'); // Y/y   year
      //format = format.replace('M', 'M');  // M     month
        format = format.replace(/d/g, 'D'); // D/d   date

        format = format.replace(/H/g, 'h'); // H/h   hour
      //format = format.replace('m', 'm');  // m     minute
        format = format.replace(/S/g, 's'); // S/s   second
        format = format.replace(/X/g, 'x'); // X/x   milliseconds

        format = format.replace(/z/g, 'Z'); // Z/z   time zone
    }

    // YYYY-MM-DD hh:mm:ss.xxx ZZZZZ
    return new Date().MyFormat(format);
}

exports.objLength = objLength;
exports.getModule = getModule;

exports.isUrl = isUrl;
exports.hasFile = hasFile;
exports.readFile = readFile;
exports.readJSON = readJSON;
exports.writeFile = writeFile;

exports.getTimestamp = getTimestamp;
exports.ISO8061RegExp = "[0-9]{4}-[0-9]{2}-[0-9]{2}\s+[0-9]{2}:[0-9]{2}:[0-9]{2}\s+([\s+-])*[0-9]{4}";
