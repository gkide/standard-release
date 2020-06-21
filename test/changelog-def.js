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
  shell.exec('git commit -m "docs: init"');
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
  + '### ☠ Security\n'
  + '### ⚠ Deprecated\n'
  + '### ☣ Incompatible\n'
  + '### ☕ Features\n'
  + '### ☀ Fixed\n'
  + '### ⛭ Changed\n'
  + '### ⚑ Preview\n'
  + '### ☂ Dependencies';

const ChangelogT = HEADER + TEMPLATE;

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
  + '### ☠ Security\n'
  + '- **security**: ' + subject + '\n'
  + '\n'
  + '### ⚠ Deprecated\n'
  + '- **deprecated**(`api`): ' + subject + '\n'
  + '\n'
  + '### ☣ Incompatible\n'
  + '- **breaking**(`api`): ' + subject + '\n'
  + '- **break**(`major`): ' + subject + '\n'
  + '- **major**: ' + subject + '\n'
  + '\n'
  + '### ☕ Features\n'
  + '- **feature**: ' + subject + '\n'
  + '- **minor**: ' + subject + '\n'
  + '- **feat**: ' + subject + '\n'
  + '\n'
  + '### ☀ Fixed\n'
  + '- **bugfix**: ' + subject + '\n'
  + '- **patch**: ' + subject + '\n'
  + '- **fix**: ' + subject + '\n'
  + '\n'
  + '### ⛭ Changed\n'
  + '- **refactor**: ' + subject + '\n'
  + '- **revert**: ' + subject + '\n'
  + '- **perf**: ' + subject + '\n'
  + '\n'
  + '### ⚑ Preview\n'
  + '- **preview**: ' + subject + '\n'
  + '- **wip**: ' + subject + '\n'
  + '\n'
  + '### ☂ Dependencies\n'
  + '- **deps**: ' + subject + '\n'
  + '- **build**: ' + subject;
  return data;
}

const oldReleaseLogs = '## 2015-10-06 20:03:10 +0800  Release [v0.1.0-rc.0](https://github.com/gkide/def/releases/tag/v0.1.0-rc.0)\n'
  + '\n'
  + '[[☠](#v_Security_201902170357580800)]\n'
  + '[[⚠](#v_Deprecated_201902170357580800)]\n'
  + '[[☣](#v_Incompatible_201902170357580800)]\n'
  + '[[☕](#v_Features_201902170357580800)]\n'
  + '[[☀](#v_Fixed_201902170357580800)]\n'
  + '[[⛭](#v_Changed_201902170357580800)]\n'
  + '[[⚑](#v_Preview_201902170357580800)]\n'
  + '[[☂](#v_Dependencies_201902170357580800)]\n'
  + 'comparing with [v0.0.1](https://github.com/gkide/def/compare/v0.0.1...v0.1.0-rc.0)\n'
  + '\n'
  + '<span id = "v_Security_201902170357580800"></span>\n'
  + '### ☠ Security\n'
  + '- Anything related with vulnerabilities and security.\n'
  + '\n'
  + '<span id = "v_Deprecated_201902170357580800"></span>\n'
  + '### ⚠ Deprecated\n'
  + '- Something is deprecated, like the API, UI, Configuration, etc.\n'
  + '\n'
  + '<span id = "v_Incompatible_201902170357580800"></span>\n'
  + '### ☣ Incompatible\n'
  + '- Changes incompatible with previous releases, blah, blah, blah ...\n'
  + '\n'
  + '<span id = "v_Features_201902170357580800"></span>\n'
  + '### ☕ Features\n'
  + '- New added functionality, configurations or features related to the end user.\n'
  + '\n'
  + '<span id = "v_Fixed_201902170357580800"></span>\n'
  + '### ☀ Fixed\n'
  + '- Any bug fixes.\n'
  + '\n'
  + '<span id = "v_Changed_201902170357580800"></span>\n'
  + '### ⛭ Changed\n'
  + '- Something notable changes related to the end user.\n'
  + '\n'
  + '<span id = "v_Preview_201902170357580800"></span>\n'
  + '### ⚑ Preview\n'
  + '- Some thing preview, like new feature working in process but not stable.\n'
  + '\n'
  + '<span id = "v_Dependencies_201902170357580800"></span>\n'
  + '### ☂ Dependencies\n'
  + '- Update dependency XXX to v3.5.1 and do releated changes.';

function getUserLogs(title, extra) {
  let data = title
  + '\n'
  + '### ☠ Security\n'
  + '- Do not keep password locally.\n'
  + '\n'
  + '### ⚠ Deprecated\n'
  + '- **API:** libmake_it_fly()\n'
  + '  * The defails descriptions blah, blah, blah ...\n'
  + '\n'
  + '### ☣ Incompatible\n'
  + '- Drop python 2.7 and 3.4 support\n'
  + '\n'
  + '### ☕ Features\n'
  + '- **config:** mutil-language supported.\n'
  + '- **cli:** add format option for report output ([1ecf097](https://github.com/gkide/def/commit/1ecf097)).\n'
  + '\n'
  + '### ☀ Fixed\n'
  + '- Fix line ends initialization when no line end has been read.\n'
  + '\n'
  + '### ⛭ Changed\n'
  + '- **Config:** The default language changed to English if not set([450b2de](https://github.com/gkide/def/commit/450b2de)).\n'
  + '\n'
  + '### ⚑ Preview\n'
  + '- **Chinese:** Simplified and Traditional Chinese supporting.\n'
  + '\n'
  + '### ☂ Dependencies\n'
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
  // Major
  it('git commit for changelog update: Incompatible', () => {
    // Incompatible
    shell.exec('git commit --allow-empty -m "major: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "break(major): ' + subject + '"');
    shell.exec('git commit --allow-empty -m "breaking(api): ' + subject + '"');
  });
  it('git commit for changelog update: Security & Deprecated', () => {
    // Security
    shell.exec('git commit --allow-empty -m "security: ' + subject + '"');
    // Deprecated
    shell.exec('git commit --allow-empty -m "deprecated(api): ' + subject + '"');
  });
  // Minor
  it('git commit for changelog update: Features', () => {
    // Features
    shell.exec('git commit --allow-empty -m "feat: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "minor: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "feature: ' + subject + '"');
  });
  // Patch
  it('git commit for changelog update: Fixed', () => {
    // Fixed
    shell.exec('git commit --allow-empty -m "fix: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "patch: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "bugfix: ' + subject + '"');
  });
  // Tweak
  it('git commit for changelog update: Changed', () => {
    // Changed
    shell.exec('git commit --allow-empty -m "perf: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "revert: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "refactor: ' + subject + '"');
  });
  it('git commit for changelog update: Dependencies', () => {
    // Dependencies
    shell.exec('git commit --allow-empty -m "build: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "deps: ' + subject + '"');
  });
  it('git commit for changelog update: Preview', () => {
    // Preview
    shell.exec('git commit --allow-empty -m "wip: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "preview: ' + subject + '"');
  });
  // Version Unrelated
  it('git commit for changelog update: skip raw logs(A)', () => {
    // skip raw logs
    shell.exec('git commit --allow-empty -m "ci: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "docs: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "test: ' + subject + '"');
  });
  it('git commit for changelog update: skip raw logs(B)', () => {
    // skip raw logs
    shell.exec('git commit --allow-empty -m "style: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "chore: ' + subject + '"');
    shell.exec('git commit --allow-empty -m "skip commit checking:' + subject + '"');
  });
}

function getPromptMsg(ver, file) {
  return 'Release Tag should be: ' + ver + '\nUpdated changelog: ' + file + '\n'
}

let SUBJECT = 'feature';
let CHANGELOG_B = "";
function runTesting(standardRelease) {
  describe('standard-release changelog with default rules', () => {
    before(initTmpRepo);
    after(cleanTmpRepo);

    const E_TEMPLATE = 'ERROR: Insert [Unrelease] to CHANGELOG.md error, exit.\n';

    it('--changelog-template: error for [Unrelease] exits', () => {
      chai.expect(tools.readFile('CHANGELOG.md')).to.equal(ChangelogT);
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
      shell.exec('git commit -m "docs: update changelog"');

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
      shell.exec('git commit --allow-empty -m "perf: bump tweak"');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      const v0013CHANGELOG = getPromptMsg('v0.0.1-3', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v0013CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('cp CHANGELOG.md C6.md');
    });

    it('--changelog-release(C7.md): release bump patch to v0.0.7', () => {
      shell.exec('git tag v0.0.6');
      shell.exec('git commit --allow-empty -m "fix: bump patch"');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      const v007CHANGELOG = getPromptMsg('v0.0.7', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v007CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('cp CHANGELOG.md C7.md');
    });

    it('--changelog-release(C8.md): release bump minor to v0.8.0', () => {
      shell.exec('git tag v0.7.1');
      shell.exec('git commit --allow-empty -m "feat: bump minor"');
      let ret = standardRelease("-c -r");
      chai.expect(ret.code).to.equal(0);
      const v080CHANGELOG = getPromptMsg('v0.8.0', 'CHANGELOG.md');
      chai.expect(ret.stdout).to.equal(v080CHANGELOG);
      chai.expect(ret.stderr).to.empty;
      shell.exec('cp CHANGELOG.md C8.md');
    });

    it('--changelog-release(C9.md): release bump major to v9.0.0', () => {
      shell.exec('git tag v8.1.0');
      shell.exec('git commit --allow-empty -m "break: bump major"');
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
