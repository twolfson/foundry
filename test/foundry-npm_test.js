// Load in dependencies
var expect = require('chai').expect;
var fixtureUtils = require('./utils/fixtures');
var Foundry = require('../bin/foundry');

// Guarantee safeguards against exec are in place (see WARNING.md)
var childUtils = require('./utils/child-process');

// Define our test
describe('A release', function () {
  describe.only('in a node module (npm)', function () {
    fixtureUtils.fixtureDir('npm');
    // TODO: Make this a util itself
    before(function release (done) {
      // Introduce custom stubbing
      var program = new Foundry();
      var that = this;
      childUtils.shellExec._allow();
      childUtils.childExec._allow();
      program.once('postRelease#before', function banAndStub () {
        childUtils.shellExec._ban();
        childUtils.childExec._ban();
        childUtils.shellExec._stub(that);
      });

      // Set up our callback
      program.once('postRelease#after', done);

      // Run through the release
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });

    it('', function () {
      console.log(process.cwd());
    });
  });

  describe.skip('in a bower module', function () {
  });
  describe.skip('in a component module', function () {
  });
  describe.skip('in a PyPI package', function () {
  });
});
