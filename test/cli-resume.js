// Load in our dependencies
var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var childUtils = require('./utils/child-process');

// Define our test constants
var foundryCmd = path.join(__dirname, '..', 'bin', 'foundry');

describe('foundry', function () {
  // DEV: Typically `register` and `publish` fail due to not being logged in
  describe('releasing a package that has a failing `register` command', function () {
    var actualFoundryResumePath = __dirname + '/test-files/foundry-release-resume-failure/foundry-resume.json';
    var expectedFoundryResumePath = __dirname + '/test-files/foundry-resume.json';
    before(function removeExistingResume(done) {
      fs.unlink(actualFoundryResumePath, function handleRemoval(err) {
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
      var actualFoundryContent = fs.readFileSync(actualFoundryResumePath, 'utf8');
      actualFoundryContent = actualFoundryContent.replace(/%FOUNDRY_VERSION%/g, '$FOUNDRY_VERSION');
      actualFoundryContent = actualFoundryContent.replace(/%FOUNDRY_MESSAGE%/g, '$FOUNDRY_MESSAGE');
      var expectedFoundryContent = fs.readFileSync(expectedFoundryResumePath, 'utf8');
      expect(actualFoundryContent).to.equal(expectedFoundryContent);
    });
  });

  describe('resuming a failed release and succeeding', function () {
    var sourceFoundryResumePath = __dirname + '/test-files/foundry-resume.json';
    var targetFoundryResumePath = __dirname + '/test-files/foundry-release-resume-continue/foundry-resume.json';
    before(function guaranteeResumeJson() {
      var sourceContent = fs.readFileSync(sourceFoundryResumePath, 'utf8');
      if (process.platform === 'win32') {
        sourceContent = sourceContent.replace(/\$FOUNDRY_VERSION/g, '%FOUNDRY_VERSION%');
        sourceContent = sourceContent.replace(/\$FOUNDRY_MESSAGE/g, '%FOUNDRY_MESSAGE%');
      }
      fs.writeFileSync(targetFoundryResumePath, sourceContent);
    });

    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-resume-continue'));
    childUtils.spawn('node', [foundryCmd, 'resume', '--no-color'], {
      cwd: path.join(__dirname, 'test-files', 'foundry-release-resume-continue')
    });

    it('has no errors', function () {
      expect(this.err).to.equal(null);
    });

    it('does not run update-files and commit', function () {
      expect(this.stdout).to.not.contain('Step run (echo): update-files 1.0.0 Release 1.0.0');
      expect(this.stdout).to.not.contain('Step run (echo): commit 1.0.0 Release 1.0.0');
    });

    it('notifies user about skipping update-files and commit', function () {
      /* eslint-disable max-len */
      expect(this.stdout).to.match(
        /Step already complete: foundry-release-echo update-files "(\$FOUNDRY_VERSION|%FOUNDRY_VERSION%)" "(\$FOUNDRY_MESSAGE|%FOUNDRY_MESSAGE%)"/);
      expect(this.stdout).to.match(
        /Step already complete: foundry-release-echo commit "(\$FOUNDRY_VERSION|%FOUNDRY_VERSION%)" "(\$FOUNDRY_MESSAGE|%FOUNDRY_MESSAGE%)"/);
      /* eslint-enable max-len */
    });

    // DEV: This is the previously failing step
    it('runs register successfully', function () {
      expect(this.stdout).to.contain('Step run (echo): register 1.0.0 Release 1.0.0');
    });

    // DEV: This is an unresumed step
    it('runs publish successfully', function () {
      expect(this.stdout).to.contain('Step run (echo): publish 1.0.0 Release 1.0.0');
    });

    it('cleans up the `foundry-resume.json`', function () {
      fs.stat(targetFoundryResumePath, function handleStat(err, stat) {
        // Verify we have an error and it's about the file not existing
        expect(err).to.not.equal(null);
        expect(err.code).to.equal('ENOENT');
      });
    });
  });

  describe('resuming a failed release and failing', function () {
    var sourceFoundryResumePath = __dirname + '/test-files/foundry-resume.json';
    var targetFoundryResumePath = __dirname + '/test-files/foundry-release-resume-failure/foundry-resume.json';
    before(function guaranteeResumeJson() {
      var sourceContent = fs.readFileSync(sourceFoundryResumePath, 'utf8');
      if (process.platform === 'win32') {
        sourceContent = sourceContent.replace(/\$FOUNDRY_VERSION/g, '%FOUNDRY_VERSION%');
        sourceContent = sourceContent.replace(/\$FOUNDRY_MESSAGE/g, '%FOUNDRY_MESSAGE%');
      }
      fs.writeFileSync(targetFoundryResumePath, sourceContent);
    });

    it('exits with a non-zero code', function () {
      expect(this.err).to.not.equal(null);
    });

    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-resume-failure'));
    childUtils.spawn('node', [foundryCmd, 'resume', '--no-color'], {
      cwd: path.join(__dirname, 'test-files', 'foundry-release-resume-failure')
    });

    it('does not run update-files and commit', function () {
      expect(this.stdout).to.not.contain('Step run (echo): update-files 1.0.0 Release 1.0.0');
      expect(this.stdout).to.not.contain('Step run (echo): commit 1.0.0 Release 1.0.0');
    });

    it('attempts to run register and fails', function () {
      expect(this.stdout).to.contain('Running step: foundry-release-echo register');
      expect(this.stderr).to.contain('(echo) Something went wrong =(');
    });

    it('does not run publish', function () {
      expect(this.stdout).to.not.contain('Running step: foundry-release-echo publish');
    });

    it('leaves another `foundry-resume.json`', function () {
      // DEV: We need to convert `%` to `$` to support Windows
      var actualFoundryContent = fs.readFileSync(targetFoundryResumePath, 'utf8');
      actualFoundryContent = actualFoundryContent.replace(/%FOUNDRY_VERSION%/g, '$FOUNDRY_VERSION');
      actualFoundryContent = actualFoundryContent.replace(/%FOUNDRY_MESSAGE%/g, '$FOUNDRY_MESSAGE');
      var expectedFoundryContent = fs.readFileSync(sourceFoundryResumePath, 'utf8');
      expect(actualFoundryContent).to.equal(expectedFoundryContent);
    });
  });

  describe('resuming a failed release with mismatched commands', function () {
    var sourceFoundryResumePath = __dirname + '/test-files/foundry-resume.json';
    var targetFoundryResumePath = __dirname + '/test-files/foundry-release-resume-continue/foundry-resume.json';
    before(function adjustResumeJson() {
      var sourceContent = fs.readFileSync(sourceFoundryResumePath, 'utf8');
      if (process.platform === 'win32') {
        sourceContent = sourceContent.replace(/\$FOUNDRY_VERSION/g, '%FOUNDRY_VERSION%');
        sourceContent = sourceContent.replace(/\$FOUNDRY_MESSAGE/g, '%FOUNDRY_MESSAGE%');
      }
      var sourceObject = JSON.parse(sourceContent);
      sourceObject.steps.pop();
      this.adjustedContent = JSON.stringify(sourceObject, null, 2);
      fs.writeFileSync(targetFoundryResumePath, this.adjustedContent);
    });
    after(function cleanup() {
      delete this.targetContent;
    });

    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-resume-continue'));
    childUtils.spawn('node', [foundryCmd, 'resume', '--no-color'], {
      cwd: path.join(__dirname, 'test-files', 'foundry-release-resume-continue')
    });

    it('exits with a non-zero code', function () {
      expect(this.err).to.not.equal(null);
    });

    it('does not run any configuration nor steps', function () {
      expect(this.stdout).to.equal('');
    });

    it('notifies user of mismatched steps', function () {
      expect(this.stderr).to.contain(
        'Expected `foundry-resume.json` and `.foundryrc/package.json` commands to line up exactly');
    });

    it('does not adjust `foundry-resume.json`', function () {
      // DEV: No adjustment needed here because we alrady performed our coercion
      var actualFoundryContent = fs.readFileSync(targetFoundryResumePath, 'utf8');
      var expectedFoundryContent = this.adjustedContent;
      expect(actualFoundryContent).to.equal(expectedFoundryContent);
    });
  });
});
