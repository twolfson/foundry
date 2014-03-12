// Load in dependencies
var childProcess = require('child_process');
var expect = require('chai').expect;
var Foundry = require('../');
var ReleaseCacheFactory = require('./test-files/foundry-release-cache-factory.js');

// Stop childProcess exec and spawn calls too unless people opt in to our methods
// DEV: This is borrowed from https://github.com/twolfson/foundry/blob/0.15.0/test/utils/child-process.js
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
    it('updates the package version', function () {
      // ['setVersion', {version, message, description}, cb]
      // DEV: We are verifying we meet the spec
      var method = this.releaseLib.calls[0][0];
      expect(method).to.equal('setVersion');

      var setVersionArgs = this.releaseLib.calls[0][1];
      expect(setVersionArgs[0]).to.deep.equal(expectedParams);
      expect(setVersionArgs[1]).to.be.a('function');
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

    it('updates the package version', function () {
      var firstMethod = this.releaseLib.calls[0][0];
      expect(firstMethod).to.equal('setVersion');
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
      var release = new Foundry.Release([{}]);
      release.release('0.1.0', done);
    });
  });
});

// DEV: Hooray, internal tests ;_;
describe('Foundry.getReleaseLibs', function () {
  describe('resolving local node_modules', function () {
    it.skip('discovers installed foundry modules', function () {
      // TODO: Test me
    });
  });
});
