'use strict';

// Native
const path = require('path');

// Packages
const chai = require('chai');

// Utilities
const config = require(path.resolve(__dirname, 'config.js'));

function runTesting(standardRelease) {
    describe('standard-release --is-semver', function() {
        it("OK  [1.2.3]", function() {
            let ret = standardRelease('--is-semver 1.2.3');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [a.b.c]", function() {
            let ret = standardRelease('--is-semver a.b.c');
            chai.expect(ret.code).to.equal(1);
            const imsg = "INFO: Not valid semver(https://semver.org/) => a.b.c\n";
            chai.expect(ret.stdout).to.equal(imsg);
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [a.b.c] silent", function() {
            let ret = standardRelease('-x --is-semver a.b.c');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("OK  [v1.2.3]", function() {
            let ret = standardRelease('--is-semver v1.2.3');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("OK  [1.0.0-alpha]", function() {
            let ret = standardRelease('--is-semver 1.0.0-alpha');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-~alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-~alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-!alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-!alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-@alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-@alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-#alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-#alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-$alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-$alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-%alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-%alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-^alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-^alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-*alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-*alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("OK  [1.0.0+alpha]", function() {
            let ret = standardRelease('--is-semver 1.0.0+alpha');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-=alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-=alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0-.alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0-.alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [1.0.0--alpha]", function() {
            let ret = standardRelease('-x --is-semver 1.0.0--alpha');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("OK  [1.0.0-alpha.1]", function() {
            let ret = standardRelease('--is-semver 1.0.0-alpha.1');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("OK  [1.0.0-0.3.7]", function() {
            let ret = standardRelease('--is-semver 1.0.0-0.3.7');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("OK  [1.0.0-x.7.z.92]", function() {
            let ret = standardRelease('--is-semver 1.0.0-x.7.z.92');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

         it("OK  [1.0.0-alpha+001]", function() {
            let ret = standardRelease('--is-semver 1.0.0-alpha+001');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

         it("OK  [1.0.0+20130313144700]", function() {
            let ret = standardRelease('--is-semver 1.0.0+20130313144700');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

         it("OK  [1.0.0-beta+exp.sha.5114f85]", function() {
            let ret = standardRelease('--is-semver 1.0.0-beta+exp.sha.5114f85');
            chai.expect(ret.code).to.equal(0);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });

        it("ERR [42.6.7.9.3-alpha]", function() {
            let ret = standardRelease('-x --is-semver 42.6.7.9.3-alpha');
            chai.expect(ret.code).to.equal(1);
            chai.expect(ret.stdout).to.empty;
            chai.expect(ret.stderr).to.empty;
        });
    });
}

runTesting(config.standardRelease);
