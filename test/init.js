'use strict';

// Native
const path = require('path');

// Packages
const chai = require('chai');
const shell = require('shelljs');

// Utilities
const config = require(path.resolve(__dirname, 'config.js'));

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
    });
}

runTesting(config.standardRelease);
