// Load in dependencies
var childProcess = require('child_process');

// Stop exec calls from happening
var shell = require('shelljs');
var originalExec = shell.exec;
shell.exec = shell.complaintExec = function () {
  throw new Error('`shell.exec` was being called with ' + JSON.stringify(arguments));
};

// Stop childProcess exec and spawn calls too unless people opt in to our methods
var iKnowWhatIAmDoingSpawn = childProcess.spawn;
childProcess.spawn = childProcess.complaintSpawn = function () {
  throw new Error('`childProcess.spawn` was being called with ' + JSON.stringify(arguments));
};
var iKnowWhatIAmDoingExec = childProcess.exec;
childProcess.exec = childProcess.complaintExec = function () {
  throw new Error('`childProcess.exec` was being called with ' + JSON.stringify(arguments));
};


// var tmp = shell.tempdir();
// var fixtureDir = path.join(tmp, 'foundry_test');
// before(function deleteFixtureDir (done) {
//   wrench.rmdirRecursive(fixtureDir, false, function (err) {
//     done();
//   });
// });
// before(function createFixtureDir () {
//   // DEV: There is no asynchronous flavor. We could use mkdirp but this is fine.
//   wrench.mkdirSyncRecursive(fixtureDir);
// });
// before(function goToFixtureDir () {
//   process.chdir(fixtureDir);
// });
