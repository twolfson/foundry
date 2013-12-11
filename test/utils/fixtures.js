// Load in dependencies
var path = require('path');
var shell = require('shelljs');
var wrench = require('wrench');

// Set up our fixture dir
var tmp = shell.tempdir();
exports.dir = path.join(tmp, 'foundry_test');
before(function deleteFixtureDir (done) {
  wrench.rmdirRecursive(exports.dir, false, function (err) {
    done();
  });
});
before(function createFixtureDir () {
  // DEV: There is no asynchronous flavor. We could use mkdirp but this is fine.
  wrench.mkdirSyncRecursive(exports.dir);
});

// TODO: Use this... similar to that of sexy-bash-prompt
exports.fixtureDir = function (name) {
  before(function copyFixtures (done) {

  });
  // TODO: Perform this
  // before(function moveDotgitToGit (done) {

  // });
};
