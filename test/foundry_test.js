// Load in dependencies
var expect = require('chai').expect;
var quote = require('shell-quote').quote;
var WritableStreamBuffer = require('stream-buffers').WritableStreamBuffer;
var childUtils = require('./utils/child-process');
var Foundry = require('../');

// Start our tests
describe('foundry', function () {
  describe.only('releasing a new package', function () {
    childUtils.addToPath(__dirname + '/test-files/foundry-release-echo/');
    before(function releaseNewPackage (done) {
      this.stdout = new WritableStreamBuffer();
      var release = new Foundry.Release(['foundry-release-echo'], {
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

    // Verify we are meeting our spec
    it('updates the package files', function () {
      expect(this.output).to.contain('Step run (echo): update-files 1.0.0 Release 1.0.0');
    });
    it('commits the updates', function () {
      console.log(this.output);
      expect(this.output).to.contain('Step run (echo): commit 1.0.0 Release 1.0.0');
    });
    it('registers the package', function () {
      expect(this.output).to.contain('Step run (echo): register 1.0.0 Release 1.0.0');
    });
    it('publishes the package', function () {
      expect(this.output).to.contain('Step run (echo): publish 1.0.0 Release 1.0.0');
    });
    it('calls our steps in order', function () {
      expect(this.output).to.match(/update-files.*commit.*register.*publish/);
    });

    // Verify we are being nice to our users =)
    it('provides the user with semantic step info', function () {
      expect(this.output).to.contain('Running step: foundry-release-echo update-files 1.0.0 "Release 1.0.0"');
    });
  });

  describe('releasing an existing package', function () {
    before(function releaseNewPackage (done) {
      this.releaseLib = new ReleaseCacheFactory();
      var release = new Foundry.Release([this.releaseLib]);
      release.release('1.2.0', done);
    });
    after(function cleanup () {
      delete this.releaseLib;
    });

    it('updates the package files', function () {
      var firstMethod = this.releaseLib.calls[0][0];
      expect(firstMethod).to.equal('updateFiles');
    });

    it('does not register the package', function () {
      var methods = this.releaseLib.calls.map(function (call) {
        return call[0];
      });
      expect(methods).to.not.contain('register');
    });
  });

  describe('releasing a package with no commands', function () {
    it('does not error out', function (done) {
      var release = new Foundry.Release([{
        specVersion: '1.1.0'
      }]);
      release.release('1.0.0', done);
    });
  });
});

describe('foundry listing its current plugins', function () {
  childUtils.exec(quote(['node', __dirname + '/../bin/foundry',
    '--plugin-dir', __dirname + '/test-files/plugins-mock-node_modules/',
    'plugins']));

  it('includes foundry plugins', function () {
    expect(this.err).to.equal(null);
    expect(this.stdout).to.contain('foundry-release-echo@1.0.0');
  });

  it('does not include other node modules', function () {
    expect(this.stdout).to.not.contain('async');
  });
});

describe('foundry releasing an echoing plugin', function () {
  describe('for the first time', function () {
    // TODO: Move to `1.0.0` as default in support of more logical semvers
    childUtils.exec(quote(['node', __dirname + '/../bin/foundry',
      '--plugin-dir', __dirname + '/test-files/plugins-echo/',
      'release', '1.0.0']));

    it('updates files, commits, registers, and publishes', function () {
      expect(this.err).to.equal(null);
      expect(this.stdout).to.contain([
        'updateFiles occurred',
        'commit occurred',
        'register occurred',
        'publish occurred',
      ].join('\n'));
    });
  });

  describe('for a second time', function () {
    childUtils.exec(quote(['node', __dirname + '/../bin/foundry',
      '--plugin-dir', __dirname + '/test-files/plugins-echo/',
      'release', '1.1.0']));

    it('updates files, commits, and publishes', function () {
      expect(this.err).to.equal(null);
      expect(this.stdout).to.contain([
        'updateFiles occurred',
        'commit occurred',
        'publish occurred',
      ].join('\n'));
    });

    it('does not register', function () {
      expect(this.err).to.equal(null);
      expect(this.stdout).to.not.contain('register');
    });
  });
});

// DEV: Hooray, internal tests ;_;
// var echoReleaseLib = require('./test-files/plugins-mock-node_modules/foundry-release-echo');
describe('Foundry.getReleaseLibs', function () {
  describe('resolving a plugin directory', function () {
    before(function getLocalReleaseLibs (done) {
      // Resolve our local release libs
      var params = {pluginDir: __dirname + '/test-files/plugins-mock-node_modules/'};
      var that = this;
      Foundry.getReleaseLibs(params, function handleReleaseLibs (err, releaseLibs) {
        // Save the release libs and callback
        that.releaseLibs = releaseLibs;
        done(err);
      });
    });
    after(function cleanup () {
      delete this.releaseLibs;
    });

    it('discovers installed foundry modules', function () {
      // DEV: foundry modules are tagged via a `foundry-release` keyword
      expect(this.releaseLibs).to.deep.equal([echoReleaseLib]);
    });
  });
});

// DEV: This is not a required test but one for peace of mind regarding usability messaing
describe('foundry using a package with a bad `specVersion`', function () {
  childUtils.exec(quote(['node', __dirname + '/../bin/foundry',
    '--plugin-dir', __dirname + '/test-files/plugins-unsupported-version/',
    'release', '1.0.0']));

  it('notifies the user of the package name', function () {
    expect(this.err).to.not.equal(null);
    expect(this.err.message).to.contain('Actual: "1.0.0". `support-not-found.specVersion` is below the required semver for `foundry`. Please install a supported version.');
  });
});
