'use strict';

// Native
const path = require('path');

// Packages
const chai = require('chai');
const shell = require('shelljs');

// Utilities
const config = require(path.resolve(__dirname, 'config.js'));
const tools = require(path.resolve(__dirname, '..', 'lib', 'tools.js'));

const SpecSemverJS = "exports.semverRules = {\n"
  + "  major: 1,\n"
  + "  minor: 2,\n"
  + "  patch: 3,\n"
  + "  preRelease: 'pre',\n"
  + "  buildNumber: '20181214'\n"
  + "}";

const SpecChangelogJS = "exports.changelogRules = [\n"
  + "  { skip: false, semver: 'major', name: 'Security', symbol: '☠' },\n"
  + "  { skip: false, semver: 'major', name: 'Deprecated', symbol: '⚠' },\n"
  + "  { skip: false, semver: 'major', name: 'Incompatible', symbol: '☣' },\n"
  + "  { skip: false, semver: 'minor', name: 'Features', symbol: '☕' },\n"
  + "  { skip: false, semver: 'patch', name: 'Fixed', symbol: '☀' },\n"
  + "  { skip: false, semver: 'tweak', name: 'Changed', symbol: '⛭' },\n"
  + "  { skip: false, semver: 'tweak', name: 'Preview', symbol: '⚑' },\n"
  + "  { skip: false, semver: 'none', name: 'Dependencies', symbol: '☂' }\n"
  + "]"

const SpecCommitJS = "exports.commitRules = {\n"
  + "  failOnAutoFix: true,\n"
  + "  header: {\n"
  + "    maxLength: 80,\n"
  + "    type: [\n"
  + "      { skip: false, isFilter: 'Incompatible', name: 'major' },\n"
  + "      { skip: false, isFilter: 'Incompatible', name: 'break' },\n"
  + "      { skip: false, isFilter: 'Incompatible', name: 'breaking' },\n"
  + "      { skip: false, isFilter: 'Security', name: 'security' },\n"
  + "      { skip: false, isFilter: 'Deprecated', name: 'deprecated' },\n"
  + "      { skip: false, isFilter: 'Features', name: 'minor' },\n"
  + "      { skip: false, isFilter: 'Features', name: 'feat' },\n"
  + "      { skip: false, isFilter: 'Features', name: 'feature' },\n"
  + "      { skip: false, isFilter: 'Fixed', name: 'fix' },\n"
  + "      { skip: false, isFilter: 'Fixed', name: 'patch' },\n"
  + "      { skip: false, isFilter: 'Fixed', name: 'bugfix' },\n"
  + "      { skip: false, isFilter: 'Changed', name: 'perf' },\n"
  + "      { skip: false, isFilter: 'Changed', name: 'revert' },\n"
  + "      { skip: false, isFilter: 'Changed', name: 'refactor' },\n"
  + "      { skip: false, isFilter: 'Dependencies', name: 'build' },\n"
  + "      { skip: false, isFilter: 'Dependencies', name: 'deps' },\n"
  + "      { skip: false, isFilter: 'Preview', name: 'wip' },\n"
  + "      { skip: false, isFilter: 'Preview', name: 'preview' },\n"
  + "      { skip: false, isFilter: false, name: 'ci' },\n"
  + "      { skip: false, isFilter: false, name: 'docs' },\n"
  + "      { skip: false, isFilter: false, name: 'test' },\n"
  + "      { skip: false, isFilter: false, name: 'style' },\n"
  + "      { skip: false, isFilter: false, name: 'chore' },\n"
  + "      { skip: true, isFilter: false, name: 'skip' }\n"
  + "    ],\n"
  + "    scope: function(scopeMsg) {\n"
  + "      return { ok: false };\n"
  + "      return { ok: true };\n"
  + "      return { ok: true, autofix: 'new scope msg' };\n"
  + "    },\n"
  + "    subject: function(subjectMsg) {\n"
  + "      return { ok: false };\n"
  + "      return { ok: true };\n"
  + "      return { ok: true, autofix: 'new subject msg' };\n"
  + "    }\n"
  + "  },\n"
  + "  body: function(bodyMsg) {\n"
  + "    return { ok: false };\n"
  + "    return { ok: true };\n"
  + "    return { ok: true, autofix: 'new body msg' };\n"
  + "  },\n"
  + "  footer: function(footerMsg) {\n"
  + "    return { ok: false };\n"
  + "    return { ok: true };\n"
  + "    return { ok: true, autofix: 'new footer msg' };\n"
  + "  }\n"
  + "}";

const ChangelogTemplate = "# Change Log\n"
  + "\n"
  + "- ALL NOTABLE CHANGES WILL BE DOCUMENTED HERE.\n"
  + "- PROJECT VERSIONS ADHERE TO [SEMANTIC VERSIONING](http://semver.org).\n"
  + "- REPOSITORY COMMITS ADHERE TO [CONVENTIONAL COMMITS](https://conventionalcommits.org).\n"
  + "\n"
  + "\n"
  + "## [Unreleased]\n"
  + "### ☠ Security\n"
  + "### ⚠ Deprecated\n"
  + "### ☣ Incompatible\n"
  + "### ☕ Features\n"
  + "### ☀ Fixed\n"
  + "### ⛭ Changed\n"
  + "### ⚑ Preview\n"
  + "### ☂ Dependencies";

function runTesting(standardRelease) {
  // out of the source tree
  const workingDirectory = path.resolve(__dirname, '..', '..');

  describe('standard-release --init', function() {
    beforeEach(function() {
      shell.cd(workingDirectory);
      shell.rm('-rf', 'tmp');
      shell.mkdir('tmp');
      shell.cd('tmp');
    });

    afterEach(function() {
      shell.cd('..');
      shell.rm('-rf', 'tmp');
    });

    it('it is not a git repo', function() {
      let ret = standardRelease('-i');
      chai.expect(ret.code).to.equal(1);
      chai.expect(ret.stdout).to.empty;
      const emsg = path.resolve(workingDirectory, 'tmp') + "'\n";
      chai.expect(ret.stderr).to.equal("ERROR: Do not git repo: '" + emsg);
    });

    it('init a git repo, check again', function() {
      shell.exec('git init');
      let ret = standardRelease('-i');
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.empty;
      chai.expect(ret.stderr).to.empty;
    });

    it('git repo not exist', function() {
      let ret = standardRelease('-i x');
      chai.expect(ret.code).to.equal(1);
      chai.expect(ret.stdout).to.empty;
      const emsg = path.resolve(workingDirectory, 'tmp', 'x') + "'\n";
      chai.expect(ret.stderr).to.equal("ERROR: Do not exist '" + emsg);
    });

    it('directory existance check first', function() {
      shell.exec('git init');
      let ret = standardRelease('-i x');
      chai.expect(ret.code).to.equal(1);
      chai.expect(ret.stdout).to.empty;
      const emsg = path.resolve(workingDirectory, 'tmp', 'x') + "'\n";
      chai.expect(ret.stderr).to.equal("ERROR: Do not exist '" + emsg);
    });

    it('can find correct git repo path', function() {
      shell.exec('git init');
      shell.mkdir('x');
      let ret = standardRelease('-i x');
      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.empty;
      chai.expect(ret.stderr).to.empty;
    });

    it('create correct specimen config files', function() {
      shell.exec('git init');
      let ret = standardRelease('-i');
      let specFile; let fileData;
      specFile = path.resolve(workingDirectory, 'tmp', '.standard-release', 'spec.changelog.js');
      fileData = tools.readFile(specFile);
      chai.expect(SpecChangelogJS).to.equal(fileData);

      specFile = path.resolve(workingDirectory, 'tmp', '.standard-release', 'spec.commit.js');
      fileData = tools.readFile(specFile);
      chai.expect(SpecCommitJS).to.equal(fileData);

      specFile = path.resolve(workingDirectory, 'tmp', '.standard-release', 'spec.semver.js');
      fileData = tools.readFile(specFile);
      chai.expect(SpecSemverJS).to.equal(fileData);

      specFile = path.resolve(workingDirectory, 'tmp', 'CHANGELOG.md');
      fileData = tools.readFile(specFile);
      chai.expect(ChangelogTemplate).to.equal(fileData);

      chai.expect(ret.code).to.equal(0);
      chai.expect(ret.stdout).to.empty;
      chai.expect(ret.stderr).to.empty;
    });
  });
}

runTesting(config.standardRelease);
