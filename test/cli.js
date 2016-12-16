// Load in dependencies
var path = require('path');
var expect = require('chai').expect;
var childUtils = require('./utils/child-process');

// Define our test constants
var foundryCmd = path.join(__dirname, '..', 'bin', 'foundry');

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

    it('handles environment variables properly', function () {
      expect(this.stdout).to.contain('Step run (echo): update-files 1.0.0 Release 1.0.0');
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

describe('foundry using a missing command', function () {
  childUtils.spawn('node', [foundryCmd, 'release', '1.0.0'], {
    cwd: path.join(__dirname, 'test-files', 'foundry-release-unknown')
  });

  it('notifies the user of the missing command', function () {
    expect(this.err).to.not.equal(null);
    expect(this.stderr).to.match(/Attempted to run "foundry-release-unknown --spec-version" but/);
  });
});
