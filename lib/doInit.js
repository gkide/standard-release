'use strict';

// Native
const fs = require('fs');
const util = require('util');
const path = require('path');

// Packages
const myGit = require(path.join(__dirname, 'myGit'));
const config = require(path.join(__dirname, 'config'));
const myRules = require(path.join(__dirname, 'myRules'));
const template = require(path.join(__dirname, 'template'));

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
function replacer(key, value) {
  //if(!helper.cmdArgs.dev && key.match('^dev(.+)')) {
  //  return undefined; // skip tags start with 'dev' for usr
  //}
  if(typeof value == 'function') {
    // print the function text data
    return value.toString();
  } else if(key == 'type' && value instanceof Array) {
    let txt = util.format('%O', value);
    // for commitRules.header.type array format
    txt = txt.replace(/^\[\s/, '[\n      ');
    txt = txt.replace(/\},\n/g, '},\n    ');
    txt = txt.replace(/\}\s\]$/, '}\n    ]');
    return txt;
  } else {
    return value;
  }
}

// Create specimen configuration file
function createExamplesJS(helper) {
  // 1. create example commit rules, which is also the default
  const commitJS = path.join(helper.usrHome, 'spec.commit.js');
  try {
    helper.tryCreate(commitJS, null, 'exports.commitRules = ');
  } catch(err) {
    helper.errorMsg("Can not create file: " + commitJS);
  }

  let bodyData = JSON.stringify(myRules.commitRules, replacer, 2);
  bodyData = bodyData.replace(/\"/g, ''); // remove "
  bodyData = bodyData.replace(/\\n/g, '\n'); // make newline

  try {
    fs.appendFileSync(commitJS, bodyData);
  } catch(err) {
    helper.errorMsg("Can not write data to: " + commitJS);
  }

  // 2. create example for dynamic semver configuration file
  bodyData = JSON.stringify(myRules.semverRules, replacer, 2);
  bodyData = bodyData.replace(/"(\w+)"(\s*:\s*)/g, "$1$2"); // remove key's "
  bodyData = bodyData.replace(/\\n/g, '\n'); // make newline
  bodyData = bodyData.replace(/"/g, '\'');
  const semverJS = path.join(helper.usrHome, 'spec.semver.js');
  try {
    fs.appendFileSync(semverJS, "exports.semverRules = " + bodyData);
  } catch(err) {
    helper.errorMsg("Can not write data to: " + semverJS);
  }

  // 3. create example for changelog configuration file
  const changelogJS = path.join(helper.usrHome, 'spec.changelog.js');
  bodyData = '[\n  ';
  myRules.changelogRules.forEach(function(obj, index) {
    let txt = JSON.stringify(obj, null, 1);
    txt = txt.replace(/"(\w+)"(\s*:\s*)/g, "$1$2"); // remove key's "
    txt = txt.replace(/\n/g, ''); // remove newline
    txt = txt.replace(/"}/g, '" }');
    txt = txt.replace(/"/g, '\'');
    bodyData = bodyData + txt + ',\n';
    if(myRules.changelogRules.length > index + 1) {
      bodyData = bodyData + '  ';
    }
  });
  bodyData = bodyData + ']';
  bodyData = bodyData.replace(/,\n\]/g, '\n\]');
  try {
    fs.appendFileSync(changelogJS, "exports.changelogRules = " + bodyData);
  } catch(err) {
    helper.errorMsg("Can not write data to: " + changelogJS);
  }
}

function initUsrHome(helper, repoPath) {
  // check if it exist & has write permission
  let projectDir = path.resolve(process.cwd(), repoPath);
  try {
    fs.accessSync(projectDir);
  } catch(err) {
    helper.errorMsg("Do not exist '" + projectDir + "'");
  }

  // check if it is a git repo
  const repoDir = myGit.getRepoDirectory(projectDir);
  if(!repoDir) {
    helper.errorMsg("Do not git repo: '" + projectDir + "'");
  }
  projectDir = repoDir;

  // check if CHANGELOG.md exist
  const changelog = path.join(projectDir, 'CHANGELOG.md');
  try {
    helper.tryCreate(changelog, () => {
      helper.warnMsg("Already exist '" + changelog + "'");
    }, '');
  } catch(err) {
    helper.errorMsg("Can not create '" + changelog + "'");
  }

  // try to create config directory
  const usrHome = config.getUsrHome(projectDir);
  try {
    helper.tryCreate(usrHome, () => {
      helper.errorMsg("Already exist '" + usrHome + "'");
    });
  } catch(err) {
    helper.errorMsg("Can not create directory '" + usrHome + "'");
  }

  helper.usrHome = usrHome;
  createExamplesJS(helper);
  template.initChangelog(changelog);
  process.exit(0);
}

exports.usrHome = initUsrHome;
