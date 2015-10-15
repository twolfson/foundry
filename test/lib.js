// Load in dependencies
var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var WritableStreamBuffer = require('stream-buffers').WritableStreamBuffer;
var childUtils = require('./utils/child-process');
var processUtils = require('./utils/process');
var Foundry = require('../');

// Start our tests
// DEV: We have tests internally to help with debugging
describe('foundry', function () {
  describe('releasing a new package', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    before(function releaseNewPackage (done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        stdout: this.stdout,
        color: false
      });
      release.release('1.0.0', done);
    });
    before(function processOutput () {
      this.output = this.stdout.getContents().toString();
    });
    after(function cleanup () {
      delete this.output;
      delete this.stdout;
    });

    // Verify we are meeting our spec
    it('updates the package files', function () {
      expect(this.output).to.contain('Step run (echo): update-files 1.0.0 Release 1.0.0');
    });
    it('commits the updates', function () {
      expect(this.output).to.contain('Step run (echo): commit 1.0.0 Release 1.0.0');
    });
    it('registers the package', function () {
      expect(this.output).to.contain('Step run (echo): register 1.0.0 Release 1.0.0');
    });
    it('publishes the package', function () {
      expect(this.output).to.contain('Step run (echo): publish 1.0.0 Release 1.0.0');
    });
    it('calls our steps in order', function () {
      expect(this.output.replace(/\n/g, ' ')).to.match(/update-files.*commit.*register.*publish/);
    });

    // Verify we are being nice to our users =)
    it('provides the user with semantic step info', function () {
      expect(this.output).to.contain('FOUNDRY_VERSION: 1.0.0');
      expect(this.output).to.contain('FOUNDRY_MESSAGE: Release 1.0.0');
      // jscs:disable maximumLineLength
      expect(this.output).to.match(
        /Running step: foundry-release-echo update-files "(\$FOUNDRY_VERSION|%FOUNDRY_VERSION%)" "(\$FOUNDRY_MESSAGE|%FOUNDRY_MESSAGE%)"/);
      // jscs:enable maximumLineLength
    });
  });

  describe('releasing an existing package', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    before(function releaseExistingPackage (done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        stdout: this.stdout
      });
      release.release('1.2.0', done);
    });
    after(function cleanup () {
      delete this.stdout;
    });

    it('updates the package files', function () {
      expect(this.stdout.getContents().toString()).to.contain('update-files');
    });

    it('does not register the package', function () {
      expect(this.stdout.getContents().toString()).to.not.contain('register');
    });
  });
});

describe('foundry', function () {
  describe('releasing with an `releaseCommand` object', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    before(function releaseWithReleaseCommand (done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release([{
        type: 'releaseCommand',
        command: 'foundry-release-echo'
      }], {stdout: this.stdout});
      release.release('1.0.0', done);
    });
    after(function cleanup () {
      delete this.stdout;
    });

    it('runs each of the release command steps', function () {
      var output = this.stdout.getContents().toString();
      expect(output.replace(/\n/g, ' ')).to.match(/update-files.*commit.*register.*publish/);
    });
  });

  describe('releasing with an `customCommand` object', function () {
    before(function releaseWithCustomCommand (done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release([{
        type: 'customCommand',
        // jscs:disable maximumLineLength
        updateFiles: 'node --eval "console.log(\'Custom update-files: \' + process.env.FOUNDRY_VERSION + \' \'+ process.env.FOUNDRY_MESSAGE);"',
        commit: 'node --eval "console.log(\'Custom update-files: \' + process.env.FOUNDRY_VERSION + \' \'+ process.env.FOUNDRY_MESSAGE);"'
        // jscs:enable maximumLineLength
      }], {stdout: this.stdout, color: false});
      release.release('1.0.0', done);
    });
    before(function processOutput () {
      this.output = this.stdout.getContents().toString();
    });
    after(function cleanup () {
      delete this.stdout;
      delete this.output;
    });

    it('runs the command\'s specific steps', function () {
      expect(this.output).to.contain('Running step: node --eval');
      expect(this.output).to.contain('Custom update-files: 1.0.0 Release 1.0.0');
    });

    it('runs no other steps', function () {
      var stepRunMatches = this.output.match(/Running step/);
      expect(stepRunMatches).to.have.length(1);
    });
  });
});

describe('foundry', function () {
  describe('releasing a package with `--dry-run` enabled', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    before(function releaseDryPackage (done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        color: false,
        dryRun: true,
        stdout: this.stdout
      });
      release.release('1.0.0', done);
    });
    before(function processOutput () {
      this.output = this.stdout.getContents().toString();
    });
    after(function cleanup () {
      delete this.output;
      delete this.stdout;
    });

    it('provides the user with step info', function () {
      expect(this.output).to.contain('FOUNDRY_VERSION: 1.0.0');
      expect(this.output).to.contain('FOUNDRY_MESSAGE: Release 1.0.0');
      // jscs:disable maximumLineLength
      expect(this.output).to.match(
        /Running step: foundry-release-echo update-files "(\$FOUNDRY_VERSION|%FOUNDRY_VERSION%)" "(\$FOUNDRY_MESSAGE|%FOUNDRY_MESSAGE%)"/);
      // jscs:enable maximumLineLength
    });

    it('does not call the command', function () {
      expect(this.output).to.not.contain('Step run (echo)');
    });
  });
});

describe('foundry', function () {
  // DEV: Typically `register` and `publish` fail due to not being logged in
  describe.only('releasing a package that has a failing `register` command', function () {
    var actualFoundryResumePath = __dirname + '/test-files/foundry-release-resume-failure/foundry-resume.json';
    var expectedFoundryResumePath = __dirname + '/test-files/foundry-resume.json';

    before(function removeExistingResume (done) {
      fs.unlink(actualFoundryResumePath, function handleRemoval (err) {
        // If there was an error but it was for the file not existing, nullify it
        if (err && err.code === 'ENOENT') {
          err = null;
        }

        // Callback with our error
        done(err);
      });
    });

    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-resume-failure'));
    processUtils.changeCwd(path.join(__dirname, 'test-files', 'foundry-release-resume-failure'));
    before(function releaseFailingPackage (done) {
      var that = this;
      this.stdout = new WritableStreamBuffer();
      this.stderr = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        color: false,
        stdout: this.stdout,
        stderr: this.stderr
      });
      release.release('1.0.0', function saveError (err) {
        that.err = err;
        done();
      });
    });
    before(function processOutput () {
      this.output = this.stdout.getContents().toString();
      this.stderrOutput = this.stderr.getContents().toString();
    });
    after(function cleanup () {
      delete this.err;
      delete this.output;
      delete this.stdout;
      delete this.stderr;
      delete this.stderrOutput;
    });

    it('calls back with an error', function () {
      expect(this.err).to.not.equal(null);
    });

    it('runs update-files and commit', function () {
      expect(this.output).to.contain('Step run (echo): update-files 1.0.0 Release 1.0.0');
      expect(this.output).to.contain('Step run (echo): commit 1.0.0 Release 1.0.0');
    });

    it('attempts to run register', function () {
      expect(this.output).to.contain('Running step: foundry-release-echo register');
    });

    it('outputs failure message', function () {
      expect(this.stderrOutput).to.contain('(echo) Something went wrong =(');
    });

    it('does not run publish', function () {
      expect(this.output).to.not.contain('Running step: foundry-release-echo publish');
    });

    it('informs user how to resume execution', function () {
      expect(this.err.message).to.contain('current release can be resumed by running `foundry resume`');
    });

    it('generates a `foundry-resume.json` with the expected format', function () {
      // DEV: We need to convert `%` to `$` to support Windows
      var expectedFoundryContent = fs.readFileSync(expectedFoundryResumePath, 'utf8');
      expectedFoundryContent = expectedFoundryContent.replace(/%FOUNDRY_VERSION%/, '$FOUNDRY_VERSION');
      expectedFoundryContent = expectedFoundryContent.replace(/%FOUNDRY_MESSAGE%/, '$FOUNDRY_MESSAGE');
      var actualFoundryContent = fs.readFileSync(actualFoundryResumePath, 'utf8');
      expect(actualFoundryContent).to.equal(expectedFoundryContent);
    });
  });

  describe('resuming a failed release and succeeding', function () {
    // TODO: Add back `foundry-resume.json`

    it('does not run update-files and commit', function () {
      // Assert stdout
    });

    it('runs register successfully', function () {
      // Assert stdout has step info/invocation
      // Assert there is the failure message from `foundry-release-echo`
    });

    it('runs publish successfully', function () {
      // Assert stdout has step info/invocation
      // Assert there is the failure message from `foundry-release-echo`
    });

    it('cleans up the `foundry-resume.json`', function () {
      // TODO: Verify file no longer exists on disk
    });
  });

  describe('resuming a failed release and failing', function () {
    // TODO: Add back `foundry-resume.json`

    it('does not run update-files and commit', function () {
      // Assert stdout
    });

    it('runs register successfully', function () {
      // Assert stdout has step info/invocation
      // Assert there is the failure message from `foundry-release-echo`
    });

    it('attempts to run publish and fails', function () {
      // Assert stdout has step info/invocation
      // Assert there is the failure message from `foundry-release-echo`
    });

    it('outputs an updated `foundry-resume.json`', function () {
      // TODO: Verify file no longer exists on disk
    });
  });

  describe('resuming a failed release with mismatched commands', function () {
    it('does not run any steps', function () {
      // Assert stdout
      // TODO: We should compare the entirety of steps before anything is run or written to stdout
      //   This means if the length is different
      //   or the commands themselves have changed, then error out
    });

    it('notifies user of mismatched steps', function () {
      //
    });

    it('does not clean up `foundry-resume.json`', function () {
      // Assert stdout has step info/invocation
      // Assert there is the failure message from `foundry-release-echo`
    });

    it('runs publish successfully', function () {
      // Assert stdout has step info/invocation
      // Assert there is the failure message from `foundry-release-echo`
    });

    it('cleans up the `foundry-resume.json`', function () {
      // TODO: Verify file no longer exists on disk
    });
  });
});
