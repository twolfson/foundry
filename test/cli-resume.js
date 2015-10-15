// Load in our dependencies
var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var childUtils = require('./utils/child-process');

// Define our test constants
var foundryCmd = path.join(__dirname, '..', 'bin', 'foundry');

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
    childUtils.spawn('node', [foundryCmd, 'release', '--no-color', '1.0.0'], {
      cwd: path.join(__dirname, 'test-files', 'foundry-release-resume-failure')
    });

    it('exits with a non-zero code', function () {
      expect(this.err).to.not.equal(null);
    });

    it('runs update-files and commit', function () {
      expect(this.stdout).to.contain('Step run (echo): update-files 1.0.0 Release 1.0.0');
      expect(this.stdout).to.contain('Step run (echo): commit 1.0.0 Release 1.0.0');
    });

    it('attempts to run register', function () {
      expect(this.stdout).to.contain('Running step: foundry-release-echo register');
    });

    it('outputs failure message', function () {
      expect(this.stderr).to.contain('(echo) Something went wrong =(');
    });

    it('does not run publish', function () {
      expect(this.stdout).to.not.contain('Running step: foundry-release-echo publish');
    });

    it('informs user how to resume execution', function () {
      expect(this.stderr).to.contain('current release can be resumed by running `foundry resume`');
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

  // TODO: Since this will be more complex to set up inline, let's go with invoking on the CLI for this feature
  //   it will reduce the amount of redundant tests we need
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
