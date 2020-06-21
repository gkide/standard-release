'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
const chai = require('chai');
const shell = require('shelljs');

// Utilities
const config = require(path.resolve(__dirname, 'config.js'));
const gitTags = require(path.resolve(__dirname, '..', 'lib', 'myGit'));
const mySemVer = require(path.resolve(__dirname, '..', 'lib', 'mySemVer'));

function initTmpRepo() {
  shell.rm('-rf', 'tmp');
  shell.mkdir('tmp');
  shell.cd('tmp');
  shell.exec('git init');
}

function cleanTmpRepo() {
  shell.cd('../');
  shell.rm('-rf', 'tmp');
}

function runTestingAsync() {
  describe('package: semver git tags, async API', () => {
    before(initTmpRepo);
    after(cleanTmpRepo);

    it('should error if no commits found', (done) => {
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err.code).to.be.equal(128);
        done();
      });
    });

    it('should get no semver tags', (done) => {
      fs.writeFileSync('test1', '');
      shell.exec('git add --all && git commit -m "chore: first commit"');
      shell.exec('git tag foo');
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        chai.expect(semTags).to.be.empty;
        chai.expect(gitTags).to.be.deep.equal(['foo']);
        done();
      });
    });

    it('should get the semver tag', (done) => {
      fs.writeFileSync('test2', '');
      shell.exec('git add --all && git commit -m"chore: second commit"');
      shell.exec('git tag v2.0.0');
      fs.writeFileSync('test3', '');
      shell.exec('git add --all && git commit -m"chore: third commit"');
      shell.exec('git tag va.b.c');
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        chai.expect(semTags).to.deep.equal(['v2.0.0']);
        gitTags.sort();
        chai.expect(gitTags).to.deep.equal([ 'foo', 'va.b.c' ]);
        done();
      });
    });

    it('should get both semver tags', (done) => {
      shell.exec('git tag v3.0.0');
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        semTags.sort(mySemVer.semverCmpAscending);
        chai.expect(semTags).to.deep.equal([ 'v2.0.0', 'v3.0.0' ]);
        gitTags.sort();
        chai.expect(gitTags).to.deep.equal([ 'foo', 'va.b.c' ]);
        done();
      });
    });

    it('should get all semver tags if two tags on same commit', (done) => {
      shell.exec('git tag v2.0.1');
      shell.exec('git tag v3.0.1');
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        semTags.sort(mySemVer.semverCmpAscending);
        const wantTags = [ 'v2.0.0', 'v2.0.1', 'v3.0.0', 'v3.0.1' ];
        chai.expect(semTags).to.deep.equal(wantTags);
        gitTags.sort();
        chai.expect(gitTags).to.deep.equal([ 'foo', 'va.b.c' ]);
        done();
      });
    });

    it('should still work if run it again', (done) => {
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        semTags.sort(mySemVer.semverCmpAscending);
        const wantTags = [ 'v2.0.0', 'v2.0.1', 'v3.0.0', 'v3.0.1' ];
        chai.expect(semTags).to.deep.equal(wantTags);
        gitTags.sort();
        chai.expect(gitTags).to.deep.equal([ 'foo', 'va.b.c' ]);
        done();
      });
    });

    it('should be in reverse commit/ASCII order', (done) => {
      fs.writeFileSync('test4', '');
      shell.exec('git add --all && git commit -m"chore: fourth commit"');
      shell.exec('git tag v1.0.0');
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        const wantTags = [
          'v1.0.0',
          'v3.0.1',
          'v3.0.0',
          'v2.0.1',
          'v2.0.0',
        ];
        chai.expect(semTags).to.deep.equal(wantTags);
        chai.expect(gitTags).to.deep.equal(['va.b.c', 'foo']);
        done();
      });
    });

    it('should work with prerelease', (done) => {
      fs.writeFileSync('test5', '');
      shell.exec('git add --all && git commit -m"chore: fifth commit"');
      shell.exec('git tag 5.0.0-pre');
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        const wantTags = [
          '5.0.0-pre',
          'v1.0.0',
          'v3.0.1',
          'v3.0.0',
          'v2.0.1',
          'v2.0.0',
        ];
        chai.expect(semTags).to.deep.equal(wantTags);
        chai.expect(gitTags).to.deep.equal(['va.b.c', 'foo']);
        done();
      });
    });

    it('should tag prefix works(V)', (done) => {
      fs.writeFileSync('test6', '');
      shell.exec('git add --all && git commit -m "chore: test6"');
      shell.exec('git tag V1.0.0');
      shell.exec('git tag V2.0.0');
      shell.exec('git tag Va.b.c');
      gitTags.semverTagFilter('V', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        chai.expect(semTags).to.deep.equal([ 'V2.0.0', 'V1.0.0' ]);
        chai.expect(gitTags).to.deep.equal([ 'Va.b.c' ]);
        done();
      });
    });

    it('should tag prefix works(foo-bar@)', (done) => {
      fs.writeFileSync('test5', '');
      shell.exec('git add --all && git commit -m "chore: test5"');
      shell.exec('git tag foo-bar@1.0.0');
      shell.exec('git tag foo-bar@v2.0.0');
      shell.exec('git tag foo-bar@va.b.c');
      gitTags.semverTagFilter('foo-bar@', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        chai.expect(semTags).to.deep.equal([ 'foo-bar@v2.0.0', 'foo-bar@1.0.0' ]);
        chai.expect(gitTags).to.deep.equal([ 'foo-bar@va.b.c' ]);
        done();
      });
    });

    it('should work with empty commit', (done) => {
      shell.exec('rm -rf .git test*');
      shell.exec('git init');
      shell.exec('git commit --allow-empty -m "chore: empty commit"');
      shell.exec('git tag v1.1.0');
      shell.exec('git tag pkg@1.0.0'); // should be ignored.
      gitTags.semverTagFilter('', (err, semTags, gitTags) => {
        chai.expect(err).to.be.null;
        chai.expect(semTags).to.deep.equal([ 'v1.1.0' ]);
        chai.expect(gitTags).to.deep.equal(['pkg@1.0.0']);
        done();
      });
    });
  });
}

function runTestingSync() {
  describe('package: semver git tags, sync API', () => {
    before(initTmpRepo);
    after(cleanTmpRepo);

    it('should empty array if no commits found', (done) => {
      const tags = gitTags.semverTagFilterSync('');
      chai.expect(tags.semTags).to.be.empty;
      chai.expect(tags.gitTags).to.be.empty;
      done();
    });

    it('should get no semver tags', (done) => {
      fs.writeFileSync('test1', '');
      shell.exec('git add --all && git commit -m "chore: first commit"');
      shell.exec('git tag foo');
      const tags = gitTags.semverTagFilterSync('');
      chai.expect(tags.semTags).to.be.empty;
      chai.expect(tags.gitTags).to.be.deep.equal(['foo']);
      done();
    });

    it('should get the semver tag', (done) => {
      fs.writeFileSync('test2', '');
      shell.exec('git add --all && git commit -m"chore: second commit"');
      shell.exec('git tag v2.0.0');
      fs.writeFileSync('test3', '');
      shell.exec('git add --all && git commit -m"chore: third commit"');
      shell.exec('git tag va.b.c');
      const tags = gitTags.semverTagFilterSync('');
      chai.expect(tags.semTags).to.deep.equal(['v2.0.0']);
      tags.gitTags.sort();
      chai.expect(tags.gitTags).to.deep.equal([ 'foo', 'va.b.c' ]);
      done();
    });

    it('should get both semver tags', (done) => {
      shell.exec('git tag v3.0.0');
      const tags = gitTags.semverTagFilterSync('');
      tags.semTags.sort(mySemVer.semverCmpAscending);
      chai.expect(tags.semTags).to.deep.equal([ 'v2.0.0', 'v3.0.0' ]);
      tags.gitTags.sort();
      chai.expect(tags.gitTags).to.deep.equal([ 'foo', 'va.b.c' ]);
      done();
    });

    it('should get all semver tags if two tags on same commit', (done) => {
      shell.exec('git tag v2.0.1');
      shell.exec('git tag v3.0.1');
      const tags = gitTags.semverTagFilterSync('');
      tags.semTags.sort(mySemVer.semverCmpAscending);
      const wantTags = [ 'v2.0.0', 'v2.0.1', 'v3.0.0', 'v3.0.1' ];
      chai.expect(tags.semTags).to.deep.equal(wantTags);
      tags.gitTags.sort();
      chai.expect(tags.gitTags).to.deep.equal([ 'foo', 'va.b.c' ]);
      done();
    });

    it('should still work if run it again', (done) => {
      const tags = gitTags.semverTagFilterSync('');
      tags.semTags.sort(mySemVer.semverCmpAscending);
      const wantTags = [ 'v2.0.0', 'v2.0.1', 'v3.0.0', 'v3.0.1' ];
      chai.expect(tags.semTags).to.deep.equal(wantTags);
      tags.gitTags.sort();
      chai.expect(tags.gitTags).to.deep.equal([ 'foo', 'va.b.c' ]);
       done();
    });

    it('should be in reverse commit/ASCII order', (done) => {
      fs.writeFileSync('test4', '');
      shell.exec('git add --all && git commit -m"chore: fourth commit"');
      shell.exec('git tag v1.0.0');
      const tags = gitTags.semverTagFilterSync('');
      const wantTags = [
        'v1.0.0',
        'v3.0.1',
        'v3.0.0',
        'v2.0.1',
        'v2.0.0',
      ];
      chai.expect(tags.semTags).to.deep.equal(wantTags);
      chai.expect(tags.gitTags).to.deep.equal(['va.b.c', 'foo']);
      done();
    });

    it('should work with prerelease', (done) => {
      fs.writeFileSync('test5', '');
      shell.exec('git add --all && git commit -m"chore: fifth commit"');
      shell.exec('git tag 5.0.0-pre');
      const tags = gitTags.semverTagFilterSync('');
      const wantTags = [
        '5.0.0-pre',
        'v1.0.0',
        'v3.0.1',
        'v3.0.0',
        'v2.0.1',
        'v2.0.0',
      ];
      chai.expect(tags.semTags).to.deep.equal(wantTags);
      chai.expect(tags.gitTags).to.deep.equal(['va.b.c', 'foo']);
      done();
    });

    it('should tag prefix works(V)', (done) => {
      fs.writeFileSync('test6', '');
      shell.exec('git add --all && git commit -m "chore: test6"');
      shell.exec('git tag V1.0.0');
      shell.exec('git tag V2.0.0');
      shell.exec('git tag Va.b.c');
      const tags = gitTags.semverTagFilterSync('V');
      chai.expect(tags.semTags).to.deep.equal([ 'V2.0.0', 'V1.0.0' ]);
      chai.expect(tags.gitTags).to.deep.equal([ 'Va.b.c' ]);
      done();
    });

    it('should tag prefix works(foo-bar@)', (done) => {
      fs.writeFileSync('test5', '');
      shell.exec('git add --all && git commit -m "chore: test5"');
      shell.exec('git tag foo-bar@1.0.0');
      shell.exec('git tag foo-bar@v2.0.0');
      shell.exec('git tag foo-bar@va.b.c');
      const tags = gitTags.semverTagFilterSync('foo-bar@');
      chai.expect(tags.semTags).to.deep.equal([ 'foo-bar@v2.0.0', 'foo-bar@1.0.0' ]);
      chai.expect(tags.gitTags).to.deep.equal([ 'foo-bar@va.b.c' ]);
      done();
    });

    it('should work with empty commit', (done) => {
      shell.exec('rm -rf .git test*');
      shell.exec('git init');
      shell.exec('git commit --allow-empty -m "chore: empty commit"');
      shell.exec('git tag v1.1.0');
      shell.exec('git tag pkg@1.0.0'); // should be ignored
      const tags = gitTags.semverTagFilterSync('');
      chai.expect(tags.semTags).to.deep.equal([ 'v1.1.0' ]);
      chai.expect(tags.gitTags).to.deep.equal(['pkg@1.0.0']);
      done();
    });
  });
}

function runTesting() {
  runTestingAsync();
  runTestingSync();
}

runTesting(config.standardRelease);
