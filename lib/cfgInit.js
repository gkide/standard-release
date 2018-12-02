const fs = require('fs');
const path = require('path');

const header = 'exports.attr = ';
const body = {
    devPrintCmdArgs: true,
    devA: true,
    devPrinFAdArgs: true,
    XY: true,
    zh: {
        ab: 5,
        xy: 6
    },
    func: function(x,y) {
        return x+y;
    }
}

exports.cfgInit = function(helper) {
    const cfgFile = path.join(helper.usrHome, helper.fixSym.cfgFile);
    try {
        helper.tryCreate(cfgFile, null, header);
    } catch(err) {
        helper.errorMsg("Can not create file: " + cfgFile);
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    function replacer(key, value) {
        if(key.match('^dev(.+)')) {
            return undefined; // skip tags start with 'dev'
        }

        if(typeof value == 'function') {
            // just print function text data
            return value.toString();
        } else {
            return value;
        }
    }

    let bodyData = JSON.stringify(body, replacer, 4);
    bodyData = bodyData.replace(/\"/g, ''); // remove "
    bodyData = bodyData.replace(/\\n/g, '\n'); // make newline
    try {
        fs.appendFileSync(cfgFile, bodyData);
    } catch(err) {
        helper.errorMsg("Can not write data to: " + cfgFile);
    }
}
