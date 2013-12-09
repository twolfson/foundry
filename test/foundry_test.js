// Load in dependencies
var childProcess = require('child_process');
var path = require('path');
var expect = require('chai').expect;
var sinon = require('sinon');
var wrench = require('wrench');
var Foundry = require('../bin/foundry');

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

// DEV: NEVER EVER RUN FOUNDRY VIA .exec
// DEV: WE CANNOT STOP .exec CALLS FROM OCCURRING IN ANOTHER PROCESS

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

function stubShellExec() {
  before(function () {
    this.execStub = sinon.stub(shell, 'exec', function () {
      return {};
    });
  });
  after(function () {
    this.execStub.restore();
  });
}

function allowShellExec(fn, cb) {
  shell.exec = originalExec;
  fn(function (err) {
    shell.exec = shell.complaintExec;
    cb(err);
  });
}
function allowChildExec(fn, cb) {
  childProcess.exec = iKnowWhatIAmDoingExec;
  fn(function (err) {
    childProcess.exec = childProcess.complaintExec;
    cb(err);
  });
}


describe('A release', function () {
  describe('in a git folder', function () {
    before(function createGitFolder () {
      this.gitDir = path.join(fixtureDir, 'git_test');
      wrench.mkdirSyncRecursive(this.gitDir);
    });

    // TODO: Use premade git directory a la sexy-bash-prompt
    before(function initializeGitFolder (done) {
      var that = this;
      process.chdir(this.gitDir);
      iKnowWhatIAmDoingExec('git init', function (err, stdout, stderr) {
        that.stdout = stdout;
        done(err);
      });
    });

    before(function release (done) {
      // TODO: Consider `allow` function
      allowShellExec(function (cb1) {
        allowChildExec(function (cb2) {
          var program = new Foundry();
          program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
          // TODO: Figure out how to hook in better (program.parse does not provide a callback hook)
          // TODO: Maybe an EventEmitter? (error, end)
          setTimeout(cb2, 100);
        }, cb1);
      }, done);
    });

    it('adds a git tag', function () {

      // childProcess.exec('git tag', function (err, stdout, stderr) {
      //   if (err) {
      //     return done(err);
      //   }
      //   expect(stdout).to.equal('0.1.0');
      // });
    });
  });
});
