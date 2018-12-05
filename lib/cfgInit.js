const fs = require('fs');
const util = require('util');
const path = require('path');

const header = 'exports.attr = ';
const body = {
    // For more readable project history and generate periodically changelog:
    // - each commit message consists of a header, a body and a footer
    // - header has a special format includes a type, a scope and a subject
    // The commit message should be structured as follows:
    // <type>[scope]: <subject>
    // <ONE-BLANK-LINE>
    // [body]
    // <ONE-BLANK-LINE>
    // [footer]
    commitRulesDefault: true,
    commitRules: {
        typeAny: false, // type can be any of word
        typeIgnore: false, // type can be empty or not
        typeMixedCase: false, // always lowercase or can be mixed
        headerMaxLength: 80, // the max length of whole header message
        // Periodically changelog will automatically generated based on those tags
        type: [
            //////////////////////////////////////////////////
            // Patches a bug in the codebase
            // - Correlates with PATCH in semantic versioning
            { skip: false, isFilter: true,  name: 'fix' },
            // Introduces a new feature to the codebase
            // - Correlates with MINOR in semantic versioning
            { skip: false, isFilter: true,  name: 'feat' },
            // Introduces a breaking change to the codebase
            // - Correlates with MAJOR in semantic versioning
            { skip: false, isFilter: true,  name: 'break' },
            //////////////////////////////////////////////////
            // Skip commit checking for Work In Process(WIP)
            { skip: true,  isFilter: false, name: 'WIP' },
            { skip: true,  isFilter: false, name: 'TODO' },
            //////////////////////////////////////////////////
            // Changes of CI configuration files or scripts
            { skip: false, isFilter: false, name: 'ci' },
            // Documentation changes only
            { skip: false, isFilter: false, name: 'docs' },
            // Changes that improves the performance
            { skip: false, isFilter: false, name: 'perf' },
            // Adding missing tests or correcting existing tests
            { skip: false, isFilter: false, name: 'test' },
            // Changes that do not affect the meaning of the code
            { skip: false, isFilter: false, name: 'style' },
            // Changes that affect the build system or external dependencies
            { skip: false, isFilter: false, name: 'build' },
            // Changes that do not modify source or test files
            { skip: false, isFilter: false, name: 'chore' },
            // Reverts to previous commit
            { skip: false, isFilter: false, name: 'revert' },
            // A code change that neither fixes a bug nor adds a feature
            { skip: false, isFilter: false, name: 'refactor' },
        ],
        // Default: lowercase, one word, can be empty
        scope: function(scopeMsg) {
            return true; // true if OK
        },
        // Default: sentence-case, no empty, no ending with dot(.)
        subject: function(subjectMsg) {
            return true; // true if OK
        },
        // Default: can be anything, including empty
        body: function(bodyMsg) {
            return true; // true if OK
        },
        // default: [CLOSE#XXX]: ... OR [ISSUE#XXX]: ... if not empty
        footer: function(footerMsg) {
            return true; // true if OK
        },
    },
}

exports.commitRules = body.commitRules; // default commit rules
exports.usrHome = function(helper) {
    const cfgFile = path.join(helper.usrHome, 'config.example.js');
    try {
        helper.tryCreate(cfgFile, null, header); // create example & empty config file
        const data = header + '{\n    commitRulesDefault: true,\n}';
        helper.tryCreate(path.join(helper.usrHome, helper.fixSym.cfgFile), null, data);
    } catch(err) {
        helper.errorMsg("Can not create file: " + cfgFile);
    }

    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
    function replacer(key, value) {
        if(!helper.cmdArgs.dev && key.match('^dev(.+)')) {
            return undefined; // skip tags start with 'dev' for usr
        }

        if(typeof value == 'function') {
            // print the function text data
            return value.toString();
        } else if(key == 'type' && value instanceof Array) {
            let txt = util.format('%O', value);
            txt = txt.replace(/^\[\s/, '[\n            ');
            txt = txt.replace(/\},\n/g, '},\n          ');
            txt = txt.replace(/\}\s\]$/, '}\n        ]');
            return txt;
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
