// Load in dependencies
var childProcess = require('child_process');
var path = require('path');
var expect = require('chai').expect;
var sinon = require('sinon');
var wrench = require('wrench');
var Foundry = require('../bin/foundry');

// Stop exec calls from happening
var shell = require('shelljs');
var _exec = shell.exec;
shell.exec = function () {
  throw new Error('`shell.exec` was being called with ' + JSON.stringify(arguments));
};

// Stop childProcess exec and spawn calls too unless people opt in to our methods
childProcess.iKnowWhatIAmDoingSpawn = childProcess.spawn;
childProcess.spawn = function () {
  throw new Error('`childProcess.spawn` was being called with ' + JSON.stringify(arguments));
};
childProcess.iKnowWhatIAmDoingExec = childProcess.exec;
childProcess.exec = function () {
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

function stubExec() {
  before(function stubExec () {
    this.execStub = sinon.stub(shell, 'exec', function () {
      return {};
    });
  });
  after(function () {
    this.execStub.restore();
  });
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
      childProcess.iKnowWhatIAmDoingExec('git init', function (err, stdout, stderr) {
        that.stdout = stdout;
        done(err);
      });
    });
    stubExec();

    before(function release (done) {
      var program = new Foundry();
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
      // TODO: Figure out how to hook in better
      setTimeout(done, 1000);
    });

    it('adds a git tag', function () {
      expect(this.execStub.args[0]).to.deep.equal(['git commit -a -m "Release 0.1.0"']);
      expect(this.execStub.args[1]).to.deep.equal(['git tag 0.1.0 -a -m "Release 0.1.0"']);
      expect(this.execStub.args[2]).to.deep.equal(['git push']);
      expect(this.execStub.args[3]).to.deep.equal(['git push --tags']);

      // childProcess.exec('git tag', function (err, stdout, stderr) {
      //   if (err) {
      //     return done(err);
      //   }
      //   expect(stdout).to.equal('0.1.0');
      // });
    });
  });
});
