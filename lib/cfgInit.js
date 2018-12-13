'use strict';

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
        failOnAutoFix: true, // fail if auto fix
        header: {
            maxLength: 80, // header message max length
            // CHANGELOG will automatically generated based on those tags
            type: [
                //////////////////////////////////////////////////
                // Introduces a breaking change to the codebase
                // - Correlates with MAJOR in semantic versioning
                { skip: false, isFilter: true,  name: 'major' },
                { skip: false, isFilter: true,  name: 'break' },
                { skip: false, isFilter: true,  name: 'breaking' },
                // Introduces a new feature to the codebase
                // - Correlates with MINOR in semantic versioning
                { skip: false, isFilter: true,  name: 'minor' },
                { skip: false, isFilter: true,  name: 'feat' },
                { skip: false, isFilter: true,  name: 'feature' },
                // Patches a bug in the codebase
                // - Correlates with PATCH in semantic versioning
                { skip: false, isFilter: true,  name: 'patch' },
                { skip: false, isFilter: true,  name: 'fix' },
                { skip: false, isFilter: true,  name: 'bugfix' },
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
                //////////////////////////////////////////////////
                // Skip commit checking for Work In Process(WIP)
                { skip: true,  isFilter: false, name: 'WIP' },
            ],
            // Default: lowercase, one word, can be empty
            scope: function(scopeMsg) {
                return { ok: false };
                return { ok: true };
                return { ok: true, autofix: 'new scope msg' };
            },
            // Default: lower-case-started, no empty, no ending with dot(.)
            subject: function(subjectMsg) {
                return { ok: false };
                return { ok: true };
                return { ok: true, autofix: 'new subject msg' };
            }
        },
        // Default: can be anything, including empty
        body: function(bodyMsg) {
            return { ok: false };
            return { ok: true };
            return { ok: true, autofix: 'new body msg' };
        },
        // default: if not empty, should be one of
        // [CLOSE] ... or [CLOSE#XXX] ...
        // [KNOWN ISSUE] ... or [KNOWN ISSUE#XXX] ...
        // [BREAKING CHANGES] ... or [BREAKING CHANGES#XXX] ...
        footer: function(footerMsg) {
            return { ok: false };
            return { ok: true };
            return { ok: true, autofix: 'new footer msg' };
        }
    }
}

function initConfigFile(helper) {
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
            txt = txt.replace(/^\[\s/, '[\n                ');
            txt = txt.replace(/\},\n/g, '},\n              ');
            txt = txt.replace(/\}\s\]$/, '}\n            ]');
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

function initUsrHome(helper, repoPath) {
    // check if it exist & has write permission
    const repoDir = path.resolve(process.cwd(), repoPath);
    try {
        fs.accessSync(repoDir);
    } catch(err) {
        helper.errorMsg("Do not exist '" + repoDir + "'");
    }

    // check if it is a git repo
    const gitDir = path.join(repoDir, '.git');
    try {
        fs.accessSync(gitDir);
    } catch(err) {
        helper.errorMsg("Do not find '" + gitDir + "'");
    }

    // check if CHANGELOG.md exist
    const changelog = path.join(repoDir, 'CHANGELOG.md');
    try {
        helper.tryCreate(changelog, () => {
            helper.errorMsg("Already exist '" + changelog + "'");
        }, '');
    } catch(err) {
        helper.errorMsg("Can not create '" + changelog + "'");
    }

    // try to create config directory
    const usrHome = path.join(repoDir, helper.fixSym.usrHome);
    try {
        helper.tryCreate(usrHome, () => {
            helper.errorMsg("Already exist '" + usrHome + "'");
        });
    } catch(err) {
        helper.errorMsg("Can not create directory '" + usrHome + "'");
    }

    helper.usrHome = usrHome;
    initConfigFile(helper);
    process.exit(0);
}

exports.initUsrHome = initUsrHome;
// default commit rules
exports.attr = {
    commitRulesDefault: true,
    commitRules: body.commitRules,
};
