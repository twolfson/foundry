// Load in dependencies
var path = require('path');
var expect = require('chai').expect;
var WritableStreamBuffer = require('stream-buffers').WritableStreamBuffer;
var childUtils = require('./utils/child-process');
var Foundry = require('../');

// Start our tests
// DEV: We have tests internally to help with debugging
describe('foundry', function () {
  describe('releasing a new package', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    before(function releaseNewPackage(done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        stdout: this.stdout,
        color: false
      });
      release.release('1.0.0', done);
    });
    before(function processOutput() {
      this.output = this.stdout.getContents().toString();
    });
    after(function cleanup() {
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
      /* eslint-disable max-len */
      expect(this.output).to.match(
        /Running step: foundry-release-echo update-files "(\$FOUNDRY_VERSION|%FOUNDRY_VERSION%)" "(\$FOUNDRY_MESSAGE|%FOUNDRY_MESSAGE%)"/);
      /* eslint-enable max-len */
    });
  });

  describe('releasing an existing package', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    before(function releaseExistingPackage(done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        stdout: this.stdout
      });
      release.release('1.2.0', done);
    });
    after(function cleanup() {
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
    before(function releaseWithReleaseCommand(done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release([{
        type: 'releaseCommand',
        command: 'foundry-release-echo'
      }], {stdout: this.stdout});
      release.release('1.0.0', done);
    });
    after(function cleanup() {
      delete this.stdout;
    });

    it('runs each of the release command steps', function () {
      var output = this.stdout.getContents().toString();
      expect(output.replace(/\n/g, ' ')).to.match(/update-files.*commit.*register.*publish/);
    });
  });

  describe('releasing with an `customCommand` object', function () {
    before(function releaseWithCustomCommand(done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release([{
        type: 'customCommand',
        /* eslint-disable max-len */
        updateFiles: 'node --eval "console.log(\'Custom update-files: \' + process.env.FOUNDRY_VERSION + \' \'+ process.env.FOUNDRY_MESSAGE);"',
        commit: 'node --eval "console.log(\'Custom update-files: \' + process.env.FOUNDRY_VERSION + \' \'+ process.env.FOUNDRY_MESSAGE);"'
        /* eslint-enable max-len */
      }], {stdout: this.stdout, color: false});
      release.release('1.0.0', done);
    });
    before(function processOutput() {
      this.output = this.stdout.getContents().toString();
    });
    after(function cleanup() {
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
    before(function releaseDryPackage(done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        color: false,
        dryRun: true,
        stdout: this.stdout
      });
      release.release('1.0.0', done);
    });
    before(function processOutput() {
      this.output = this.stdout.getContents().toString();
    });
    after(function cleanup() {
      delete this.output;
      delete this.stdout;
    });

    it('provides the user with step info', function () {
      expect(this.output).to.contain('FOUNDRY_VERSION: 1.0.0');
      expect(this.output).to.contain('FOUNDRY_MESSAGE: Release 1.0.0');
      /* eslint-disable max-len */
      expect(this.output).to.match(
        /Running step: foundry-release-echo update-files "(\$FOUNDRY_VERSION|%FOUNDRY_VERSION%)" "(\$FOUNDRY_MESSAGE|%FOUNDRY_MESSAGE%)"/);
      /* eslint-enable max-len */
    });

    it('does not call the command', function () {
      expect(this.output).to.not.contain('Step run (echo)');
    });
  });
});

describe('foundry', function () {
  describe('initially releasing a package with a custom `registerVersion`', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    before(function releaseDryPackage(done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        color: false,
        registerVersion: '0.1.0',
        stdout: this.stdout
      });
      release.release('0.1.0', done);
    });
    before(function processOutput() {
      this.output = this.stdout.getContents().toString();
    });
    after(function cleanup() {
      delete this.output;
      delete this.stdout;
    });

    it('invokes `register`', function () {
      expect(this.output).to.contain('Running step: foundry-release-echo register');
    });
  });

  describe('releasing another version of a package with a custom `registerVersion`', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    before(function releaseDryPackage(done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
        color: false,
        registerVersion: '0.1.0',
        stdout: this.stdout
      });
      release.release('1.0.0', done);
    });
    before(function processOutput() {
      this.output = this.stdout.getContents().toString();
    });
    after(function cleanup() {
      delete this.output;
      delete this.stdout;
    });

    it('does not invoke `register`', function () {
      expect(this.output).to.not.contain('Running step: foundry-release-echo register');
    });
  });
});
