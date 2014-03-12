// Load in dependencies
var childProcess = require('child_process');
var expect = require('chai').expect;
var foundry = require('../');

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
    it('updates the package version', function () {

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
