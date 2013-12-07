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
  rmdirRecursive(fixtureDir, done);
});
before(function createFixtureDir (done) {
  mkdirRecursive(fixtureDir, done);
});
before(function goToFixtureDir (done) {
  process.chdir(fixtureDir);
});

function fixtureDir(name) {
  before(function copyFixtures (done) {

  });
  // TODO: Perform this
  // before(function moveDotgitToGit (done) {

  // });
}

describe('A release', function () {
  describe('in a git folder', function () {
    it('adds a git tag', function () {

    });
  });
});
