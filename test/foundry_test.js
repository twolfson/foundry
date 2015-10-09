// Load in dependencies
var path = require('path');
var expect = require('chai').expect;
var WritableStreamBuffer = require('stream-buffers').WritableStreamBuffer;
var childUtils = require('./utils/child-process');
var Foundry = require('../');

// Define our test constants
var foundryCmd = path.join(__dirname, '..', 'bin', 'foundry');

// Start our tests
// DEV: Run our tests internally first to help with debugging
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
      expect(this.output).to.match(
        /Running step: foundry-release-echo update-files "(\$FOUNDRY_VERSION|%FOUNDRY_VERSION%)" "(\$FOUNDRY_MESSAGE|%FOUNDRY_MESSAGE%)"/);
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
        updateFiles: 'node --eval "console.log(\'Custom update-files: \' + process.env.FOUNDRY_VERSION + \' \'+ process.env.FOUNDRY_MESSAGE);"',
        commit: 'node --eval "console.log(\'Custom update-files: \' + process.env.FOUNDRY_VERSION + \' \'+ process.env.FOUNDRY_MESSAGE);"'
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

// DEV: Verify each of our configuration patterns work
describe('foundry listing its commands from a package.json', function () {
  childUtils.spawn('node', [foundryCmd, 'commands'], {
    cwd: path.join(__dirname, 'test-files', 'package.json-project')
  });

  it('has no errors', function () {
    expect(this.err).to.equal(null);
  });

  it('lists string based commands', function () {
    expect(this.stdout).to.contain('foundry-release-string');
  });
  it('lists releaseCommands', function () {
    expect(this.stdout).to.contain('foundry-release-object');
  });
  it('lists customCommands', function () {
    expect(this.stdout).to.contain('echo hello');
  });
});

describe('foundry listing its commands from a .foundryrc', function () {
  childUtils.spawn('node', [foundryCmd, 'commands'], {
    cwd: path.join(__dirname, 'test-files', 'foundryrc-project')
  });

  it('has no errors', function () {
    expect(this.err).to.equal(null);
  });

  it('lists string based commands', function () {
    expect(this.stdout).to.contain('foundry-release-string');
  });
  it('lists releaseCommands', function () {
    expect(this.stdout).to.contain('foundry-release-object');
  });
  it('lists customCommands', function () {
    expect(this.stdout).to.contain('echo hello');
  });
});

// DEV: Perform a release on the CLI for full accuracy
describe('foundry releasing an echoing command', function () {
  describe('for the first time', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    childUtils.spawn('node', [foundryCmd, 'release', '1.0.0'], {
      cwd: path.join(__dirname, 'test-files', 'foundry-release-echo')
    });

    it('updates files, commits, registers, and publishes', function () {
      expect(this.err).to.equal(null);
      expect(this.stdout.replace(/\n/g, ' ')).to.match(/update-files.*commit.*register.*publish/);
    });
  });

  describe('for a second time', function () {
    childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-echo'));
    childUtils.spawn('node', [foundryCmd, 'release', '1.1.0'], {
      cwd: path.join(__dirname, 'test-files', 'foundry-release-echo')
    });

    it('updates files, commits, and publishes', function () {
      expect(this.err).to.equal(null);
      expect(this.stdout.replace(/\n/g, ' ')).to.match(/update-files.*commit.*publish/);
    });

    it('does not register', function () {
      expect(this.err).to.equal(null);
      expect(this.stdout).to.not.contain('register');
    });
  });
});

// DEV: This is not a required test but one for peace of mind regarding usability messaing
describe('foundry using a command with a bad `--spec-version`', function () {
  childUtils.addToPath(path.join(__dirname, 'test-files', 'foundry-release-bad-spec-version'));
  childUtils.spawn('node', [foundryCmd, 'release', '1.0.0'], {
    cwd: path.join(__dirname, 'test-files', 'foundry-release-bad-spec-version')
  });

  it('notifies the user of the package name', function () {
    expect(this.err).to.not.equal(null);
    expect(this.stderr).to.match(
      /Expected release command "foundry-release-bad-spec-version".*2.0.0.*but it was.*1.2.0/);
  });
});
