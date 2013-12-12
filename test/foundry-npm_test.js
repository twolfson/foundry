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
  describe('in a node module (npm)', function () {
    var fixtureDir = fixtureUtils.fixtureDir('npm');
    before(function release (done) {
      // Introduce custom stubbing
      var program = foundryUtils.create({
        allowPreRelease: true,
        allowGitTag: true
      });

      // When publishing to npm, stub over exec to return all valid calls
      var that = this;
      program.once('postRelease#before', function () {
        // TODO: We should be testing against shell.exec on `private: false` for the first call. No stubbing.
        that.execStub = sinon.stub(shell, 'exec', function () {
          return {code: 0};
        });
      });

      // Run through the release
      program.once('postRelease#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });
    after(function unstub () {
      this.execStub.restore();
    });

    it('updates the package.json', function () {
      var pkgJson = fs.readFileSync(fixtureDir + '/package.json');
      expect(JSON.parse(pkgJson)).to.have.property('version', '0.1.0');
    });
    it('publishes to npm', function () {
      expect(this.execStub.args[1]).to.deep.equal(['npm publish']);
    });
  });

  describe('in a private node module (npm)', function () {
    var fixtureDir = fixtureUtils.fixtureDir('npm-private');
    before(function release (done) {
      // Introduce custom stubbing
      var program = foundryUtils.create({
        allowPreRelease: true,
        allowGitTag: true
      });

      var that = this;
      program.once('postRelease#before', function () {
        // TODO: We should be testing against shell.exec on `private: true` for the first call. No stubbing.
        that.execStub = sinon.stub(shell, 'exec', function () {
          return {code: 1};
        });
      });

      // Run through the release
      program.once('postRelease#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });
    after(function unstub () {
      this.execStub.restore();
    });

    it('updates the package.json', function () {
      var pkgJson = fs.readFileSync(fixtureDir + '/package.json');
      expect(JSON.parse(pkgJson)).to.have.property('version', '0.1.0');
    });
    it('publishes to npm', function () {
      expect(this.execStub.args).to.have.property('length', 1);
      expect(this.execStub.args[0]).to.not.contain('npm publish');
    });
  });

  describe.skip('in a PyPI package', function () {
  });
});
