'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
const chai = require('chai');
const shell = require('shelljs');

// Utilities
const config = require(path.resolve(__dirname, 'config.js'));
const tools = require(path.resolve(__dirname, '..', 'lib', 'tools'));
const myGit = require(path.resolve(__dirname, '..', 'lib', 'myGit'));

function initTmpRepo() {
  shell.rm('-rf', 'tmp');
  shell.mkdir('tmp');
  shell.cd('tmp');
  shell.exec('git init');
  config.standardRelease('-i');
  shell.exec('git add .');
  shell.exec('git commit -m "tE: init"');
  // shell.exec('git remote add origin https://abc.def.com/tmp');
}

function cleanTmpRepo() {
  shell.cd('../');
  shell.rm('-rf', 'tmp');
}

const HEADER = '# Change Log\n'
  + '\n'
  + '- ALL NOTABLE CHANGES WILL BE DOCUMENTED HERE.\n'
  + '- PROJECT VERSIONS ADHERE TO [SEMANTIC VERSIONING](http://semver.org).\n'
  + '- REPOSITORY COMMITS ADHERE TO [CONVENTIONAL COMMITS](https://conventionalcommits.org).\n'
  + '\n'
  + '\n';

const TEMPLATE = '## [Unreleased]\n'
  + '### ☠ AAAA\n'
  + '### ☕ BBBB\n'
  + '### ☀ CCCC\n'
  + '### ⛭ DDDD\n'
  + '### ☂ EEEE';

const ChangelogT = HEADER + TEMPLATE;

function writeUsrgRules() {
  const usrRulesA = "exports.changelogRules = [\n"
  + "  { skip: false, semver: 'major', name: 'AAAA', symbol: '☠' },\n"
  + "  { skip: false, semver: 'minor', name: 'BBBB', symbol: '☕' },\n"
  + "  { skip: false, semver: 'patch', name: 'CCCC', symbol: '☀' },\n"
  + "  { skip: false, semver: 'tweak', name: 'DDDD', symbol: '⛭' },\n"
  + "  { skip: false, semver: 'none',  name: 'EEEE', symbol: '☂' }\n"
  + "]";
  shell.exec('echo "' + usrRulesA + '" > .standard-release/changelog.js');

  const usrRulesB = "exports.commitRules = {\n"
  + "  failOnAutoFix: false,\n"
  + "  header: {\n"
  + "    maxLength: 100,\n"
  + "    type: [\n"
  + "      { skip: false, isFilter: 'AAAA', name: 'tA' },\n"
  + "      { skip: false, isFilter: 'BBBB', name: 'tB' },\n"
  + "      { skip: false, isFilter: 'CCCC', name: 'tC' },\n"
  + "      { skip: false, isFilter: 'DDDD', name: 'tD' },\n"
  + "      { skip: false, isFilter: 'EEEE', name: 'tE' }\n"
  + "    ],\n"
  + "    scope: function(scopeMsg) {\n"
  + "       return { ok: true };\n"
  + "    },\n"
  + "    subject: function(subjectMsg) {\n"
  + "      return { ok: true };\n"
  + "    },\n"
  + "  },\n"
  + "  body: function(bodyMsg) {\n"
  + "    return { ok: true };\n"
  + "  },\n"
  + "  footer: function(footerMsg) {\n"
  + "    return { ok: true };\n"
  + "  }\n"
  + "}";
  shell.exec('echo "' + usrRulesB + '" > .standard-release/commit.js');
}

const UnknownXYZ = '### ☘ xyz\n'
  + '- xyz: this is unknown group for unrelease\n'
  + '- xyz: blah, blah, blah, ....\n'
  + '  * xyz';

const UnknownABC = '### ☘ ABC\n'
  + '- ABC: this is unknown group for unrelease\n'
  + '- ABC: blah, blah, blah, ....\n'
  + '  * ABC';

const UnknownTODO = '### ☎ TODO\n'
  + '- TODO: this is unknown group for unrelease\n'
  + '- TODO: here can be put the todo list data';

let prevTopHashId = "";
function getPrevTopHashId() {
  let prevTopHash = myGit.repoHeadHash();
  return '<span id = "PrevTopHash=' + prevTopHash + '_major"></span>\n';
}

function getRawCommitLogs(title, subject) {
  const data = HEADER
  + prevTopHashId
  + title
  + '\n'
  + '### ☠ AAAA\n'
  + '- **tA**: ' + subject + '\n'
  + '\n'
  + '### ☕ BBBB\n'
  + '- **tB**: ' + subject + '\n'
  + '\n'
  + '### ☀ CCCC\n'
  + '- **tC**: ' + subject + '\n'
  + '\n'
  + '### ⛭ DDDD\n'
  + '- **tD**: ' + subject + '\n'
  + '\n'
  + '### ☂ EEEE\n'
  + '- **tE**: ' + subject;
  return data;
}

const oldReleaseLogs = '## 2015-10-06 20:03:10 +0800  Release [v0.1.0-rc.0](https://github.com/gkide/def/releases/tag/v0.1.0-rc.0)\n'
  + '\n'
  + '[[☠](#v_AAAA_201902170357580800)]\n'
  + '[[☕](#v_BBBB_201902170357580800)]\n'
  + '[[☀](#v_CCCC_201902170357580800)]\n'
  + '[[⛭](#v_DDDD_201902170357580800)]\n'
  + '[[☂](#v_EEEE_201902170357580800)]\n'
  + 'comparing with [v0.0.1](https://github.com/gkide/def/compare/v0.0.1...v0.1.0-rc.0)\n'
  + '\n'
  + '<span id = "v_AAAA_201902170357580800"></span>\n'
  + '### ☠ AAAA\n'
  + '- Anything related with vulnerabilities and security.\n'
  + '\n'
  + '<span id = "v_BBBB_201902170357580800"></span>\n'
  + '### ☕ BBBB\n'
  + '- New added functionality, configurations or features related to the end user.\n'
  + '\n'
  + '<span id = "v_CCCC_201902170357580800"></span>\n'
  + '### ☀ CCCC\n'
  + '- Any bug fixes.\n'
  + '\n'
  + '<span id = "v_DDDD_201902170357580800"></span>\n'
  + '### ⛭ DDDD\n'
  + '- Something notable changes related to the end user.\n'
  + '\n'
  + '<span id = "v_EEEE_201902170357580800"></span>\n'
  + '### ☂ EEEE\n'
  + '- Update dependency XXX to v3.5.1 and do releated changes.';

function getUserLogs(title, extra) {
  let data = title
  + '\n'
  + '### ☠ AAAA\n'
  + '- Do not keep password locally.\n'
  + '\n'
  + '### ☕ BBBB\n'
  + '- **config:** mutil-language supported.\n'
  + '- **cli:** add format option for report output ([1ecf097](https://github.com/gkide/def/commit/1ecf097)).\n'
  + '\n'
  + '### ☀ CCCC\n'
  + '- Fix line ends initialization when no line end has been read.\n'
  + '\n'
  + '### ⛭ DDDD\n'
  + '- **Config:** The default language changed to English if not set([450b2de](https://github.com/gkide/def/commit/450b2de)).\n'
  + '\n'
  + '### ☂ EEEE\n'
  + '- Update dependency tkit to v3.5.1.\n';

  if(extra) {
    data = data + '\n' + extra + '\n\n';
  } else {
    data += '\n\n';
  }

  return data;
}

// The following take too much time, need to split them
function runCommitGroup(subject) {
  it('git commit for changelog update: AAAA', () => {
    shell.exec('git commit --allow-empty -m "tA: ' + subject + '"');
  });
  it('git commit for changelog update: BBBB', () => {
    shell.exec('git commit --allow-empty -m "tB: ' + subject + '"');
  });
  it('git commit for changelog update: CCCC', () => {
    shell.exec('git commit --allow-empty -m "tC: ' + subject + '"');
  });
  it('git commit for changelog update: DDDD', () => {
    shell.exec('git commit --allow-empty -m "tD: ' + subject + '"');
  });
  it('git commit for changelog update: EEEE', () => {
    shell.exec('git commit --allow-empty -m "tE: ' + subject + '"');
  });
}

function getPromptMsg(ver, file) {
  return 'Release Tag should be: ' + ver + '\nUpdated changelog: ' + file + '\n'
}

let SUBJECT = 'feature';
let CHANGELOG_B = "";
function runTesting(standardRelease) {
  describe('standard-release changelog, usr rules', () => {
    before(initTmpRepo);
    after(cleanTmpRepo);

    const E_TEMPLATE = 'ERROR: Insert [Unrelease] to CHANGELOG.md error, exit.\n';

    it('--changelog-template: error for [Unrelease] exits', () => {
      writeUsrgRules(); // write usr config file
      let ret = standardRelease("-x -t");
      chai.expect(ret.code).to.equal(1);
      chai.expect(ret.stdout).to.equal("");
      chai.expect(ret.stderr).to.equal(E_TEMPLATE);
    });

    it('--changelog-template(A1.md): with CHANGELOG.md deleted', () => {
      shell.exec('rm -f CHANGELOG.md');
      let ret = standardRelease("-t");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.empty;
      chai.expect(ret.stderr).to.empty;
      chai.expect(tools.readFile('CHANGELOG.md')).to.equal(ChangelogT);
      shell.exec('mv CHANGELOG.md A1.md');
    });

    it('--changelog-template(A2.md): insert to given changelog file', () => {
      shell.exec('mkdir -p x/y');
      let ret = standardRelease("-t=x/y/my.md");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.empty;
      chai.expect(ret.stderr).to.empty;
      chai.expect(tools.readFile('x/y/my.md')).to.equal(ChangelogT);
      shell.exec('mv x/y/my.md A2.md');
    });

    it('--changelog-template(A3.md): insert template with old release logs', () => {
      const title = '## 2019-02-17 23:37:57 +0800 Release v0.0.1\n';
      const usrLogs = getUserLogs(title);
      const beforeLogs = HEADER + usrLogs + oldReleaseLogs;
      tools.writeFile('CHANGELOG.md', beforeLogs);
      let ret = standardRelease("-t");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.empty;
      chai.expect(ret.stderr).to.empty;
      const output = ChangelogT + '\n\n\n' + usrLogs + oldReleaseLogs;
      chai.expect(tools.readFile('CHANGELOG.md')).to.equal(output);
      shell.exec('mv CHANGELOG.md A3.md');
    });

    runCommitGroup(SUBJECT);

    const v001CHANGELOG = getPromptMsg('v0.0.1', 'CHANGELOG.md');

    it('--changelog(B1.md): RepoNoRemote: update with template only', () => {
      prevTopHashId = getPrevTopHashId();
      CHANGELOG_B = getRawCommitLogs('## [Unreleased]\n', SUBJECT);
      shell.exec('cp A1.md CHANGELOG.md');
      let ret = standardRelease("-c");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.equal(v001CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      chai.expect(tools.readFile('CHANGELOG.md')).to.equal(CHANGELOG_B);
      shell.exec('mv CHANGELOG.md B1.md');
    });

    it('--changelog(B2.md): RepoNoRemote: keep all unrelease groups when update', () => {
      shell.exec('rm -f CHANGELOG.md');
      let ret = standardRelease("-x -t");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.empty;
      chai.expect(ret.stderr).to.empty;
      tools.appendToFile('CHANGELOG.md', '\n\n' + UnknownXYZ);
      tools.appendToFile('CHANGELOG.md', '\n\n' + UnknownABC);
      ret = standardRelease("-c");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.equal(v001CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      const logs = CHANGELOG_B + '\n\n' + UnknownXYZ + '\n\n' + UnknownABC;
      chai.expect(tools.readFile('CHANGELOG.md')).to.equal(logs);
      shell.exec('mv CHANGELOG.md B2.md');
    });

    it('--changelog(B3.md): RepoNoRemote: update with CHANGELOG.md deleted', () => {
      shell.exec('rm -rf CHANGELOG.md');
      let ret = standardRelease("-c");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.equal(v001CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      chai.expect(tools.readFile('CHANGELOG.md')).to.equal(CHANGELOG_B);
      shell.exec('mv CHANGELOG.md B3.md');
    });

    it('--changelog-release(C1.md): init release with no CHANGELOG.md', () => {
      shell.exec('rm -f CHANGELOG.md');
      shell.exec('git remote add origin https://abc.def.com/tmp');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.equal(v001CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('mv CHANGELOG.md C1.md');
    });

    it('--changelog-release(C2.md): init release with template CHANGELOG.md', () => {
      shell.exec('cp A1.md CHANGELOG.md');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.equal(v001CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('mv CHANGELOG.md C2.md');
    });

    it('--changelog-release(C3.md): init release to given file', () => {
      let ret = standardRelease("-c=x/y/my.md -r");
      chai.expect(ret.code).to.equal(0);
      const v001xyzmy = getPromptMsg('v0.0.1', 'x/y/my.md');
      chai.expect(ret.stdout).to.equal(v001xyzmy);
      chai.expect(ret.stderr).to.empty;
      shell.exec('mv x/y/my.md C3.md');
    });

    it('--changelog-release(C4.md): keep all unrelease when release', () => {
      const extra = UnknownXYZ + '\n\n' + UnknownABC;
      const usrLogs = getUserLogs('## [Unreleased]\n', extra);
      const beforeLogs = HEADER + usrLogs + oldReleaseLogs;
      tools.writeFile('CHANGELOG.md', beforeLogs);
      shell.exec('git add .');
      shell.exec('git commit -m "tE: update changelog"');

      let ret = standardRelease("-c -r -g");
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.equal(v001CHANGELOG);
      chai.expect(ret.stderr).to.empty;

      let foundXYZ = false;
      let foundABC = false;
      tools.readFile('CHANGELOG.md').split('\n').some(function(line) {
        if(foundXYZ && foundABC) {
          return true; // break
        }
        if(line == '### ☘ xyz') {
          foundXYZ = true;
        }
        if(line == '### ☘ ABC') {
          foundABC = true;
        }
      });
      chai.expect(foundXYZ).to.equal(true);
      chai.expect(foundABC).to.equal(true);
      shell.exec('mv CHANGELOG.md C4.md');
    });

    it('--changelog-release(C5.md): release bump tweak to v0.0.1-0', () => {
      shell.exec('git tag v0.0.0');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      const v0010CHANGELOG = getPromptMsg('v0.0.1-0', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v0010CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('cp CHANGELOG.md C5.md');
    });

    it('--changelog-release(C6.md): release bump tweak to v0.0.1-3', () => {
      shell.exec('git tag v0.0.1-2');
      shell.exec('git commit --allow-empty -m "tD: bump tweak"');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      const v0013CHANGELOG = getPromptMsg('v0.0.1-3', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v0013CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('cp CHANGELOG.md C6.md');
    });

    it('--changelog-release(C7.md): release bump patch to v0.0.7', () => {
      shell.exec('git tag v0.0.6');
      shell.exec('git commit --allow-empty -m "tC: bump patch"');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      const v007CHANGELOG = getPromptMsg('v0.0.7', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v007CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('cp CHANGELOG.md C7.md');
    });

    it('--changelog-release(C8.md): release bump minor to v0.8.0', () => {
      shell.exec('git tag v0.7.1');
      shell.exec('git commit --allow-empty -m "tB: bump minor"');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      const v080CHANGELOG = getPromptMsg('v0.8.0', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v080CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('cp CHANGELOG.md C8.md');
    });

    it('--changelog-release(C9.md): release bump major to v9.0.0', () => {
      shell.exec('git tag v8.1.0');
      shell.exec('git commit --allow-empty -m "tA: bump major"');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      const v900CHANGELOG = getPromptMsg('v9.0.0', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v900CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('cp CHANGELOG.md C9.md');
    });

    it('--changelog-from(D1.md): release from given version', () => {
      shell.exec('git tag v9.0.0');
      shell.exec('rm CHANGELOG.md');
      let ret = standardRelease("-c -r -f v0.0.6");
      chai.expect(ret.code).to.equal(0);
      const v1000CHANGELOG = getPromptMsg('v10.0.0', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v1000CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('mv CHANGELOG.md D1.md');
    });
  });
}

runTesting(config.standardRelease);
