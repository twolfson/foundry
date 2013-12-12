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

// Create a directory specifically for this test
exports.fixtureDir = function (name) {
  var srcPath = path.join(__dirname, '/../test-files/', name);
  var destPath = path.join(exports.dir, name);
  before(function copyFixtures (done) {
    wrench.copyDirRecursive(srcPath, destPath, done);
  });
  before(function moveToDestPath () {
    process.chdir(destPath);
  });
  return destPath;
  // TODO: Perform this
  // TODO: Maybe this should be a separate fixture action?
  // before(function moveDotgitToGit (done) {
  // });
};
