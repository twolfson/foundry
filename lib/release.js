// Load in dependencies
var assert = require('assert');
var async = require('async');
var semver = require('semver');

// Define a class to wrap release internals
function Release(releaseCommands, options) {
  // Assert against releaseCommands
  if (!Array.isArray(releaseCommands)) {
    throw new Error('foundry expected `releaseCommands` to be an array. Received: ' + JSON.stringify(releaseCommands));
  }

  // Upcast our releaseCommands from strings to objects
  releaseCommands = releaseCommands.map(function upcastReleaseCommand (releaseCommand) {
    if (typeof releaseCommand === 'string') {
      return {
        type: 'releaseCommand',
        command: releaseCommand
      };
    } else {
      return releaseCommand;
    }
  });

  // Validate each of our command types
  releaseCommands.forEach(function validateReleaseCommand (releaseCommand) {
    if (releaseCommand.type === 'releaseCommand') {
      assert(releaseCommand.command, 'Expected `releaseCommand.command` to be defined but it was not. ' +
        'Received: ' + JSON.stringify(releaseCommand));
    } else if (releaseCommand.type === 'customCommand') {
      var hasValidCommand = releaseCommand.updateFiles || releaseCommand.commit ||
        releaseCommand.publish || releaseCommand.register;
      assert(hasValidCommand, 'Expected `customCommand` to have command for `updateFiles`, `commit`, `publish`, ' +
        'or `register` but none were defined. Received: ' + JSON.stringify(releaseCommand));
    } else {
      assert.fail('Unknown `releaseCommand.type` found, expected `releaseCommand` or `customCommand`. ' +
        'Received: ' + JSON.stringify(releaseCommand));
    }
  });

  // TODO: Verify `--spec-version` for each command

  // Save releaseCommands and options for later
  this.releaseCommands = releaseCommands;
  this.options = options || {};
}
Release.specVersion = '1.1.0';
Release.prototype = {
  release: function (version, cb) {
    // DEV: This is directly mimicking behavior from `git-release`
    var that = this;
    var params = {
      version: version,
      message: 'Release ' + version,
      description: null,

      // TODO: Load this from a file (e.g. ~/.config/foundry or ~/.foundry/config.json)
      config: {}
    };
    async.series([
      function updateFilesFn (cb) {
        that.updateFiles(params, cb);
      },
      function commitFn (cb) {
        that.commit(params, cb);
      },
      function registerFn (cb) {
        // Only run register if we are at the 'register' semver (e.g. 0.1.0)
        // TODO: Make `0.1.0` as the 'registerVersion' a config setting
        if (version === '0.1.0') {
          that.register(params, cb);
        } else {
          process.nextTick(cb);
        }
      },
      function publishFn (cb) {
        that.publish(params, cb);
      }
    ], cb);
  },

  getReleaseLibs: function (cb) {
    // DEV: Historically, these were resolved from node_modules inside release
    // DEV: This is left here in case we change our minds
    var that = this;
    process.nextTick(function () {
      cb(null, that.releaseLibs);
    });
  },

  _runReleaseCommand: function (command, params, cb) {
    this.getReleaseLibs(function (err, releaseLibs) {
      if (err) { return cb(err); }
      async.forEach(releaseLibs, function _runReleaseCommandFn (release, cb) {
        if (release[command]) {
          release[command](params, cb);
        } else {
          process.nextTick(cb);
        }
      }, cb);
    });
  },

  updateFiles: function (params, cb) {
    this._runReleaseCommand('updateFiles', params, cb);
  },
  commit: function (params, cb) {
    this._runReleaseCommand('commit', params, cb);
  },
  register: function (params, cb) {
    this._runReleaseCommand('register', params, cb);
  },
  publish: function (params, cb) {
    this._runReleaseCommand('publish', params, cb);
  }
};

// Export Release
module.exports = Release;
