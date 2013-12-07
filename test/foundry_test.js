// Load in dependencies
var childProcess = require('child_process');
var path = require('path');
var wrench = require('wrench');
var foundry = require('../bin/foundry');

// Stop exec calls from happening
// TODO: This will become mock
var shell = require('shelljs');
shell.exec = function () {};

// DEV: NEVER EVER RUN FOUNDRY VIA .exec
// DEV: WE CANNOT STOP .exec CALLS FROM OCCURRING IN ANOTHER PROCESS
// TODO: Strongly consider running tests within a Vagrant to prevent publication since nothing is configured

var tmp = shell.tempdir();
var fixtureDir = path.join(tmp, 'foundry_test');
before(function deleteFixtureDir (done) {
  wrench.rmdirRecursive(fixtureDir, false, function (err) {
    done();
  });
});
before(function createFixtureDir () {
  // DEV: There is no asynchronous flavor. We could use mkdirp but this is fine.
  wrench.mkdirSyncRecursive(fixtureDir);
});
before(function goToFixtureDir () {
  process.chdir(fixtureDir);
});

// TODO: Use this... similar to that of sexy-bash-prompt
function fixtureDir(name) {
  before(function copyFixtures (done) {

  });
  // TODO: Perform this
  // before(function moveDotgitToGit (done) {

  // });
}

describe('A release', function () {
  describe('in a git folder', function () {
    before(function createGitFolder () {
      this.gitDir = path.join(fixtureDir, 'git_test');
      wrench.mkdirSyncRecursive(this.gitDir);
    });
    before(function initializeGitFolder (done) {
      var that = this;
      process.chdir(this.gitDir);
      console.log(this.gitDir);
      // childProcess.exec('git init', function (err, stdout, stderr) {
      //   that.stdout = stdout;
        done(err);
      // });
    });

    it('adds a git tag', function () {

    });
  });
});
