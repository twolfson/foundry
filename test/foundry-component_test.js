// Load in dependencies
var fs = require('fs');
var expect = require('chai').expect;
var fixtureUtils = require('./utils/fixtures');
var foundryUtils = require('./utils/foundry');

// Guarantee safeguards against exec are in place (see WARNING.md)
var childUtils = require('./utils/child-process');

// Define our test
describe('A release', function () {
  describe('in a component module', function () {
    var fixtureDir = fixtureUtils.fixtureDir('component');
    before(function release (done) {
      // Introduce custom stubbing
      var program = foundryUtils.create({
        allowSetVersion: true
      });

      // Run through the release
      program.once('publish#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });

    it('updates the component.json', function () {
      var pkgJson = fs.readFileSync(fixtureDir + '/component.json');
      expect(JSON.parse(pkgJson)).to.have.property('version', '0.1.0');
    });
  });
});
