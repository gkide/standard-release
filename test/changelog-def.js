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
    describe('standard-release changelog, def rules', () => {
        before(initTmpRepo);
        //after(cleanTmpRepo);

        const I_USERMSG = 'Release Tag should be: v0.0.1\nUpdated changelog: CHANGELOG.md\n';
        const E_TEMPLATE = 'ERROR: Insert [Unrelease] to CHANGELOG.md error, exit.\n';

        it('--changelog-template: error for [Unrelease] exits', () => {
            let ret = standardRelease("-x --changelog-template");
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.equal("");
            chai.expect(ret.stderr).to.equal(E_TEMPLATE);
        });

        it('--changelog-template(A1.md): with CHANGELOG.md deleted', () => {
            shell.exec('rm -f CHANGELOG.md');
            let ret = standardRelease("--changelog-template");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
            chai.expect(tools.readFile('CHANGELOG.md')).to.equal(ChangelogT);
            shell.exec('mv CHANGELOG.md A1.md');
        });

        it('--changelog-template(A2.md): insert to given changelog file', () => {
            shell.exec('mkdir -p x/y');
            let ret = standardRelease("--changelog-template=x/y/my.md");
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
            let ret = standardRelease("--changelog-template");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
            const output = ChangelogT + '\n\n\n' + usrLogs + oldReleaseLogs;
            chai.expect(tools.readFile('CHANGELOG.md')).to.equal(output);
            shell.exec('mv CHANGELOG.md A3.md');
        });

        let SUBJECT = 'feature';
        let changelog = getRawCommitLogs('## [Unreleased]\n', SUBJECT);
        runCommitGroup(SUBJECT);

        it('--changelog(B1.md): RepoNoRemote: update with template only', () => {
            shell.exec('cp A1.md CHANGELOG.md');
            let ret = standardRelease("-c");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.equal(I_USERMSG);
            chai.expect(ret.stderr).to.empty;
            chai.expect(tools.readFile('CHANGELOG.md')).to.equal(changelog);
            shell.exec('mv CHANGELOG.md B1.md');
        });

        it('--changelog(B2.md): RepoNoRemote: keep all unrelease groups when update', () => {
            shell.exec('rm -f CHANGELOG.md');
            let ret = standardRelease("-x --changelog-template");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
            tools.appendToFile('CHANGELOG.md', '\n\n' + UnknownXYZ);
            tools.appendToFile('CHANGELOG.md', '\n\n' + UnknownABC);
            ret = standardRelease("-c");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.equal(I_USERMSG);
            chai.expect(ret.stderr).to.empty;
            const logs = changelog + '\n\n' + UnknownXYZ + '\n\n' + UnknownABC;
            chai.expect(tools.readFile('CHANGELOG.md')).to.equal(logs);
            shell.exec('mv CHANGELOG.md B2.md');
        });

        it('--changelog(B3.md): RepoNoRemote: update with CHANGELOG.md deleted', () => {
            shell.exec('rm -rf CHANGELOG.md');
            let ret = standardRelease("-c");
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.equal(I_USERMSG);
            chai.expect(ret.stderr).to.empty;
            chai.expect(tools.readFile('CHANGELOG.md')).to.equal(changelog);
            shell.exec('mv CHANGELOG.md B3.md');
        });

        it('--changelog-release(C1.md): RepoNoRemote: keep all unrelease groups when updating', () => {
            const extra = UnknownXYZ + '\n\n' + UnknownABC;
            const usrLogs = getUserLogs('## [Unreleased]\n', extra);
            const beforeLogs = HEADER + usrLogs + oldReleaseLogs;
            tools.writeFile('CHANGELOG.md', beforeLogs);
            shell.exec('git add .');
            shell.exec('git commit -m "docs: update changelog"');

            let ret = standardRelease("-c --changelog-release --changelog-greed");
            //chai.expect(ret.code).to.equal(0);
            //chai.expect(ret.stdout).to.equal(I_USERMSG);
            //chai.expect(ret.stderr).to.empty;
        });
    });
}

runTesting(config.standardRelease);
