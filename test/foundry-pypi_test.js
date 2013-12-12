// Load in dependencies
var fs = require('fs');
var expect = require('chai').expect;
var sinon = require('sinon');
var shell = require('shelljs');
var fixtureUtils = require('./utils/fixtures');
var foundryUtils = require('./utils/foundry');

// Guarantee safeguards against exec are in place (see WARNING.md)
var childUtils = require('./utils/child-process');

// Define our test
describe('A release', function () {
  describe.only('in a PyPI package', function () {
    var fixtureDir = fixtureUtils.fixtureDir('pypi');
    before(function release (done) {
      // Introduce custom stubbing
      var program = foundryUtils.create({
        allowPreRelease: true,
        allowGitTag: true
      });

      // Monitor shell.exec calls
      var that = this;
      program.once('postRelease#before', function () {
        // TODO: We should be testing against shell.exec on `private: true` for the first call. No stubbing.
        that.execStub = sinon.stub(shell, 'exec', function () {
          return {code: 0};
        });
      });

      // Run through the release
      program.once('postRelease#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });

    it('updates the setup.py', function () {
      var pkgPython = fs.readFileSync(fixtureDir + '/setup.py', 'utf8');
      expect(pkgPython).to.contain('version=\'0.1.0\'');
    });
  });
});
