// Load in dependencies
var assert = require('assert');
var async = require('async');
var semver = require('semver');

// Define a class to wrap release internals
function Release(releaseLibs, options) {
  // Assert against releaseLibs
  if (!Array.isArray(releaseLibs)) {
    throw new Error('foundry expected `releaseLibs` to be an array. Received: ' + JSON.stringify(releaseLibs));
  }

  // Assert that each release lib meets our spec semver requirement
  releaseLibs.forEach(function assertReleaseLibSpec (releaseLib) {
    var specVersion = releaseLib.specVersion;
    // TODO: Add naming to warning
    assert.notEqual(specVersion, undefined, '`releaseLib.specVersion` is not defined in one of the release plugins for ' +
      '`foundry`. Please determine which one is out of date and update it.');
    assert(semver.valid(specVersion), '`releaseLib.specVersion` is not a valid semver for one of the release plugins ' +
      'for `foundry`. Please determine which one is invalid and update it.');
    assert(semver.gte(specVersion, Release.specVersion), 'Expected: ">=' + Release.specVersion + '", Actual: "' + specVersion + '".' +
      '`releaseLib.specVersion` is below the required semver for `foundry`. Please determine library is invalid and update it.');
  });

  // Save releaseLibs and options for later
  this.releaseLibs = releaseLibs;
  this.options = options || {};
}
Release.specVersion = '1.0.0';
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
