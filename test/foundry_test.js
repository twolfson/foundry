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


    it('updates the package version', function () {
      // ['setVersion', {version, message, description}, cb]
      // DEV: We are verifying we meet the spec
      expect(this.releaseLib.calls[0][0]).to.equal('setVersion');
      var setVersionArgs = this.releaseLib.calls[0][1];
      expect(setVersionArgs[0]).to.deep.equal({
        version: '0.1.0',
        message: 'Release 0.1.0',
        description: null,
        config: {}
      });
      expect(setVersionArgs[1]).to.be.a('function');
    });
    it.skip('commits the updates', function () {

    });
    it.skip('registers the package', function () {

    });
    it.skip('publishes the package', function () {

    });
  });

  describe('releasing an existing package', function () {
    it.skip('updates the package version', function () {

    });

    it.skip('does not register the package', function () {

    });
  });

  describe('releasing a package with no commands', function () {
    it.skip('does not error out', function () {

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
