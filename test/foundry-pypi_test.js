// Load in dependencies
var fs = require('fs');
var expect = require('chai').expect;
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

      // Run through the release
      program.once('postRelease#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });

    it.skip('updates the setup.py', function () {
      var pkgPython = fs.readFileSync(fixtureDir + '/setup.py');
      // expect(JSON.parse(pkgPython)).to.have.property('version', '0.1.0');
    });
  });
});
