// Load in dependencies
var async = require('async');

// Define a class to wrap release internals
function Release(releaseLibs, options) {
  // Assert against releaseLibs
  if (!Array.isArray(releaseLibs)) {
    throw new Error('foundry expected `releaseLibs` to be an array. Received: ' + JSON.stringify(releaseLibs));
  }

  // Save releaseLibs and options for later
  this.releaseLibs = releaseLibs;
  this.options = options || {};
}
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
      function setVersionFn (cb) {
        that.setVersion(params, cb);
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
      async.forEach(releaseLibs, function setVersionFn (release, cb) {
        if (release[command]) {
          release[command](params, cb);
        } else {
          process.nextTick(cb);
        }
      }, cb);
    });
  },

  setVersion: function (params, cb) {
    this._runReleaseCommand('setVersion', params, cb);
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
