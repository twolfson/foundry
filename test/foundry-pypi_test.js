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
  describe('in a new PyPI package', function () {
    var fixtureDir = fixtureUtils.fixtureDir('pypi');
    before(function release (done) {
      // Introduce custom stubbing
      var program = foundryUtils.create({
        allowSetVersion: true
      });

      // Monitor shell.exec calls
      var that = this;
      program.once('register#before', function () {
        that.execStubRegister = sinon.stub(shell, 'exec');
      });
      program.once('register#after', function () {
        that.execStubRegister.restore();
      });
      program.once('publish#before', function () {
        that.execStubPublish = sinon.stub(shell, 'exec');
      });

      // Run through the release
      program.once('publish#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.1.0']);
    });
    after(function unstub () {
      this.execStubPublish.restore();
    });


    it('updates the setup.py', function () {
      var pkgPython = fs.readFileSync(fixtureDir + '/setup.py', 'utf8');
      expect(pkgPython).to.contain('version=\'0.1.0\'');
    });

    it('registers the package', function () {
      expect(this.execStubRegister.args[0]).to.deep.equal(['python setup.py register']);
    });

    it('publishes the package', function () {
      expect(this.execStubPublish.args[0][0]).to.contain(['python setup.py sdist']);
    });
  });

  describe('in a registered PyPI package', function () {
    var fixtureDir = fixtureUtils.fixtureDir('pypi-registered');
    before(function release (done) {
      // Introduce custom stubbing
      var program = foundryUtils.create({
        allowSetVersion: true
      });

      // Monitor shell.exec calls
      var that = this;
      program.once('publish#before', function () {
        that.execStub = sinon.stub(shell, 'exec');
      });

      // Run through the release
      program.once('publish#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.3.0']);
    });
    after(function unstub () {
      this.execStub.restore();
    });

    it('updates the setup.py', function () {
      var pkgPython = fs.readFileSync(fixtureDir + '/setup.py', 'utf8');
      expect(pkgPython).to.contain('version=\'0.3.0\'');
    });

    it('does not register the package', function () {
      expect(this.execStub.args[0][0]).to.not.contain('register');
    });
  });

  describe('in a private PyPI package', function () {
    var fixtureDir = fixtureUtils.fixtureDir('pypi-private');
    before(function release (done) {
      // Introduce custom stubbing
      var program = foundryUtils.create({
        allowSetVersion: true
      });

      // Monitor shell.exec calls
      var that = this;
      program.once('publish#before', function () {
        that.execStub = sinon.stub(shell, 'exec');
      });

      // Run through the release
      program.once('publish#after', done);
      program.parse(['node', '/usr/bin/foundry', 'release', '0.3.0']);
    });
    after(function unstub () {
      this.execStub.restore();
    });

    it('updates the setup.py', function () {
      var pkgPython = fs.readFileSync(fixtureDir + '/setup.py', 'utf8');
      expect(pkgPython).to.contain('version=\'0.3.0\'');
    });

    it('does not register or publish the package', function () {
      expect(this.execStub.args).to.have.property('length', 0);
    });
  });
});
