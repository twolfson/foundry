// Load in dependencies
var childProcess = require('child_process');
var expect = require('chai').expect;
var quote = require('shell-quote').quote;
var Foundry = require('../');
var ReleaseCacheFactory = require('./test-files/foundry-release-cache-factory.js');

// Stop childProcess exec and spawn calls too unless people opt in to our methods
// DEV: This is borrowed from https://github.com/twolfson/foundry/blob/0.15.0/test/utils/child-process.js
var _exec = childProcess.exec;
childProcess.spawn = function () {
  throw new Error('`childProcess.spawn` was being called with ' + JSON.stringify(arguments));
};
childProcess.exec = function () {
  throw new Error('`childProcess.exec` was being called with ' + JSON.stringify(arguments));
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

// DEV: Hooray, internal tests ;_;
var gitReleaseLib = require('foundry-release-git');
describe('Foundry.getReleaseLibs', function () {
  describe('resolving local node_modules', function () {
    before(function getLocalReleaseLibs (done) {
      // Resolve our local release libs
      var params = {pluginDir: __dirname + '/../node_modules/'};
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
      expect(this.releaseLibs).to.contain(gitReleaseLib);
    });
  });
});

// DEV: This is not a required test but one for peace of mind regarding usability messaing
describe.only('foundry using a package with a bad `specVersion`', function () {
  before(function releaseWithBadVersion (done) {
    var cmd = ['node', __dirname + '/../bin/foundry', 'release',
      '--plugin-dir', __dirname + '/test-files/plugins-unsupported-version', '1.0.0'];
    var that = this;
    _exec(quote(cmd), function handleExec (err, stdout, stderr) {
      // Save err, stdout, stderr and callback
      that.err = err;
      that.stdout = stdout;
      that.stderr = stderr;
      done();
    });
  });
  after(function cleanup () {
    delete this.err;
    delete this.stdout;
    delete this.stderr;
  });

  it('notifies the user of the package name', function () {
    console.log('output', this.err, this.stdout, this.stderr);
  });
});
