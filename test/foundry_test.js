// Load in dependencies
var childProcess = require('child_process');
var path = require('path');
var expect = require('chai').expect;
var sinon = require('sinon');
var wrench = require('wrench');
var Foundry = require('../bin/foundry');

// DEV: NEVER EVER RUN FOUNDRY VIA .exec
// DEV: WE CANNOT STOP .exec CALLS FROM OCCURRING IN ANOTHER PROCESS
// DEV: We have placed a safe-guard inside of `utils/child-process` (automatically picked up by `mocha --recursive`) for this

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
  describe.skip('in a git folder', function () {
    before(function createGitFolder () {
      this.gitDir = path.join(fixtureDir, 'git_test');
      wrench.mkdirSyncRecursive(this.gitDir);
    });

    // TODO: Use premade git directory a la sexy-bash-prompt
    before(function initializeGitFolder (done) {
      process.chdir(this.gitDir);
      iKnowWhatIAmDoingExec('git init', function (err, stdout, stderr) {
        if (err) { return done(err); }
        iKnowWhatIAmDoingExec('touch a', function (err, stdout, stderr) {
          if (err) { return done(err); }
          iKnowWhatIAmDoingExec('git add -A', function (err, stdout, stderr) {
            if (err) { return done(err); }
            iKnowWhatIAmDoingExec('git commit -m "Initial commit =D"', function (err, stdout, stderr) {
              done(err);
            });
          });
        });
      });
    });

    before(function release (done) {
      // TODO: Consider `allow` function which can enable both of these
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

    it('adds a git tag', function (done) {
      iKnowWhatIAmDoingExec('git tag', function (err, stdout, stderr) {
        if (err) {
          return done(err);
        }
        expect(stdout).to.equal('0.1.0\n');
        done();
      });
    });
  });

  describe('in a node module (npm)', function () {
    it('', function () {
      // console.log(shell.exec + '');
      console.log(childProcess.exec + '');
      console.log(childProcess.spawn + '');
    });
  });

  describe('in a bower module', function () {

  });

  describe('in a component module', function () {

  });

  describe('in a PyPI package', function () {

  });
});
