// Load in dependencies
var fs = require('fs');
var expect = require('chai').expect;
var sinon = require('sinon');
var shell = require('shelljs');
var fixtureUtils = require('./utils/fixtures');
var Foundry = require('../bin/foundry');

// Guarantee safeguards against exec are in place (see WARNING.md)
var childUtils = require('./utils/child-process');

// Define our test
describe('A release', function () {
  describe('in a node module (npm)', function () {
    fixtureUtils.fixtureDir('npm');
    // TODO: Make this a util itself
    // foundryUtils.release('0.1.0');
    before(function release (done) {
      // Introduce custom stubbing
      var program = new Foundry();
      var that = this;
      childUtils.shellExec._allow();
      childUtils.childExec._allow();
      program.once('postRelease#before', function banAndStub () {
        childUtils.shellExec._ban();
        childUtils.childExec._ban();
        that.execStub = sinon.stub(shell, 'exec', function () {
          return {code: 0};
        });
      });

      // Set up our callback
      program.once('postRelease#after', done);

      // Run through the release
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });
    after(function unstub () {
      this.execStub.restore();
    });

    it('updates the package.json', function () {
      var pkgJson = fs.readFileSync(fixtureUtils.dir + '/npm/package.json');
      expect(JSON.parse(pkgJson)).to.have.property('version', '0.1.0');
    });
    it('publishes to npm', function () {
      expect(this.execStub.args[1]).to.deep.equal(['npm publish']);
    });

    // TODO: Test private
    it.skip('does not attempt to publish private packages', function () {
    });
  });

  describe.skip('in a bower module', function () {
  });
  describe.skip('in a component module', function () {
  });
  describe.skip('in a PyPI package', function () {
  });
});
