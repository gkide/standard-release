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

function initTmpRepo() {
    shell.rm('-rf', 'tmp');
    shell.mkdir('tmp');
    shell.cd('tmp');
    shell.exec('git init');
    config.standardRelease('-i');
    shell.exec('git add .');
    shell.exec('git commit -m "docs: init"');
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

function getRawCommitLogs(title, subject) {
    const data = HEADER
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
    it('git commit for changelog update: Features', () => {
        // Features
        shell.exec('git commit --allow-empty -m "feat: ' + subject + '"');
        shell.exec('git commit --allow-empty -m "minor: ' + subject + '"');
        shell.exec('git commit --allow-empty -m "feature: ' + subject + '"');
    });
    it('git commit for changelog update: Fixed', () => {
        // Fixed
        shell.exec('git commit --allow-empty -m "fix: ' + subject + '"');
        shell.exec('git commit --allow-empty -m "patch: ' + subject + '"');
        shell.exec('git commit --allow-empty -m "bugfix: ' + subject + '"');
    });
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

function runTesting(standardRelease) {
    describe('standard-release changelog, usr rules', () => {
        before(initTmpRepo);
        //after(cleanTmpRepo);

        const I_USERMSG = 'Release Tag should be: v0.0.1\nUpdated changelog: CHANGELOG.md\n';
        const E_TEMPLATE = 'ERROR: Insert [Unrelease] to CHANGELOG.md error, exit.\n';

        it('--changelog-template: error for [Unrelease] exits', () => {
            //let ret = standardRelease("-x --changelog-template");
            //chai.expect(ret.code).to.equal(1);
            //chai.expect(ret.stdout).to.equal("");
            //chai.expect(ret.stderr).to.equal(E_TEMPLATE);
        });
    });
}

runTesting(config.standardRelease);
