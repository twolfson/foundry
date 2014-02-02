// Load in dependencies
var expect = require('chai').expect;
var path = require('path');
var shell = require('shelljs');
var sinon = require('sinon');
var wrench = require('wrench');
var childUtils = require('./utils/child-process');
var fixtureUtils = require('./utils/fixtures');
var foundryUtils = require('./utils/foundry');

// TODO: Don't tag if we aren't in a `git` repo
// TODO: Don't push if there is no remote

describe('A release', function () {
  describe('in a git folder', function () {
    before(function createGitFolder () {
      this.gitDir = path.join(fixtureUtils.dir, 'git_test');
      wrench.mkdirSyncRecursive(this.gitDir);
    });

    // TODO: Use premade git directory a la sexy-bash-prompt
    before(function initializeGitFolder (done) {
      process.chdir(this.gitDir);
      childUtils.iKnowWhatIAmDoingExec('git init', function (err, stdout, stderr) {
        if (err) { return done(err); }
        childUtils.iKnowWhatIAmDoingExec('touch a', function (err, stdout, stderr) {
          if (err) { return done(err); }
          childUtils.iKnowWhatIAmDoingExec('git add -A', function (err, stdout, stderr) {
            if (err) { return done(err); }
            childUtils.iKnowWhatIAmDoingExec('git commit -m "Initial commit =D"', function (err, stdout, stderr) {
              done(err);
            });
          });
        });
      });
    });

    before(function release (done) {
      // Allow git tag to run without restraints and callback when done
      var program = foundryUtils.create({
        allowSetVersion: true,
        allowPublish: true
      });

      program.once('publish#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });

    it('adds a git tag', function (done) {
      childUtils.iKnowWhatIAmDoingExec('git tag', function (err, stdout, stderr) {
        if (err) {
          return done(err);
        }
        expect(stdout).to.equal('0.1.0\n');
        done();
      });
    });

    it('adds a git commit', function (done) {
      childUtils.iKnowWhatIAmDoingExec('git log --format=oneline -n 1', function (err, stdout, stderr) {
        if (err) {
          return done(err);
        }
        expect(stdout).to.match(/\w{32} Release 0.1.0\n/);
        done();
      });
    });
  });
});
