// Load in dependencies
var childProcess = require('child_process');
var expect = require('chai').expect;
var quote = require('shell-quote').quote;
var childUtils = require('./utils/child-process');
var Foundry = require('../');
var ReleaseCacheFactory = require('./test-files/foundry-release-cache-factory.js');

// Stop childProcess exec and spawn calls too unless people opt in to our methods
// DEV: This is borrowed from https://github.com/twolfson/foundry/blob/0.15.0/test/utils/child-process.js
childProcess._exec = childProcess.exec;
childProcess._spawn = childProcess.spawn;
childProcess.exec = function () {
  throw new Error('`childProcess.exec` was being called with ' + JSON.stringify(arguments));
};
childProcess.spawn = function () {
  throw new Error('`childProcess.spawn` was being called with ' + JSON.stringify(arguments));
};

describe('foundry', function () {
  describe('releasing a new package', function () {
    before(function releaseNewPackage (done) {
      this.releaseLib = new ReleaseCacheFactory();
      var release = new Foundry.Release([this.releaseLib]);
      release.release('0.1.0', done);
    });
    after(function cleanup () {
      delete this.releaseLib;
    });

    var expectedParams = {
      version: '0.1.0',
      message: 'Release 0.1.0',
      description: null,
      config: {}
    };
    it('updates the package files', function () {
      // ['updateFiles', {version, message, description}, cb]
      // DEV: We are verifying we meet the spec
      var method = this.releaseLib.calls[0][0];
      expect(method).to.equal('updateFiles');

      var updateFilesArgs = this.releaseLib.calls[0][1];
      expect(updateFilesArgs[0]).to.deep.equal(expectedParams);
      expect(updateFilesArgs[1]).to.be.a('function');
    });
    it('commits the updates', function () {
      var method = this.releaseLib.calls[1][0];
      expect(method).to.equal('commit');

      var commitArgs = this.releaseLib.calls[1][1];
      expect(commitArgs[0]).to.deep.equal(expectedParams);
      expect(commitArgs[1]).to.be.a('function');
    });
    it('registers the package', function () {
      var method = this.releaseLib.calls[2][0];
      expect(method).to.equal('register');

      var registerArgs = this.releaseLib.calls[2][1];
      expect(registerArgs[0]).to.deep.equal(expectedParams);
      expect(registerArgs[1]).to.be.a('function');
    });
    it('publishes the package', function () {
      var method = this.releaseLib.calls[3][0];
      expect(method).to.equal('publish');

      var publishArgs = this.releaseLib.calls[3][1];
      expect(publishArgs[0]).to.deep.equal(expectedParams);
      expect(publishArgs[1]).to.be.a('function');
    });
  });

  describe('releasing an existing package', function () {
    before(function releaseNewPackage (done) {
      this.releaseLib = new ReleaseCacheFactory();
      var release = new Foundry.Release([this.releaseLib]);
      release.release('0.3.0', done);
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
      release.release('0.1.0', done);
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
      'release', '0.1.0']));

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
      'release', '0.2.0']));

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
var echoReleaseLib = require('./test-files/plugins-mock-node_modules/foundry-release-echo');
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
