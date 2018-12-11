'use strict';

const path = require('path');
const chai = require('chai');
const shell = require('shelljs');

function runTesting(standardRelease) {
    const workingDirectory = path.resolve(__dirname, '..', 'tmp');

    describe('standard-release --init', function() {
        beforeEach(function() {
            shell.rm('-rf', 'tmp');
            shell.mkdir('tmp');
            shell.cd('tmp');
        });
        afterEach(function() {
            shell.cd('../');
            shell.rm('-rf', 'tmp');
        });

        it('it is not a git repo', function() {
            let ret = standardRelease('-i');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            const emsg = path.resolve(workingDirectory, '.git') + "'\n";
            chai.expect(ret.stderr).to.equal("ERROR: Do not find '" + emsg);
        });

        it('init a git repo, check again', function() {
            shell.exec('mkdir .git');
            let ret = standardRelease('-i');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it('git repo not exist', function() {
            shell.exec('mkdir .git');
            let ret = standardRelease('-i x');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            const emsg = path.resolve(workingDirectory, 'x') + "'\n";
            chai.expect(ret.stderr).to.equal("ERROR: Do not exist '" + emsg);
        });
    });
}

exports.runTesting = runTesting;
