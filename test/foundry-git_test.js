// Load in dependencies
var expect = require('chai').expect;
var path = require('path');
var wrench = require('wrench');
var childUtils = require('./utils/child-process');
var fixtureUtils = require('./utils/fixtures');
var Foundry = require('../bin/foundry');

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
      // TODO: Consider `allow` function which can enable both of these
      childUtils.shellExec.allow(function (cb1) {
        childUtils.childExec.allow(function (cb2) {
          var program = new Foundry();
          program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
          // TODO: Figure out how to hook in better (program.parse does not provide a callback hook)
          // TODO: Maybe an EventEmitter? (error, end)
          setTimeout(cb2, 100);
        }, cb1);
      }, done);
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
  });
});
