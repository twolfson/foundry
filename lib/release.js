// Load in dependencies
var path = require('path');
var util = require('util');
var async = require('async');
var glob = require('glob');
var npm = require('npm');

// Define a class to wrap release internals
function Release(options) {
  // Save options for later
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
          that.emit('register#before');
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
    // Load up npm
    var that = this;
    npm.load(function (err) {
      // If there was an error, callback with it
      if (err) {
        return cb(err);
      }

      // Find all global packages
      // glob('*/package.json', {cwd: npm.globalDir}, function (err, packages) {
      glob('*/package.json', {cwd: __dirname + '/../node_modules'}, function (err, packages) {
        // If there was an error, callback with it
        if (err) {
          return cb(err);
        }

        // Filter out `foundry-release` packages
        var releasePackages = packages.filter(function (filepath) {
          var pkg = require(filepath);
          var keywords = pkg.keywords || [];
          return keywords.indexOf('foundry-release') !== -1;
        });

        // Return the libraries
        var releaseDirs = releasePackages.map(path.dirname);
        var releaseLibs = releaseDirs.map(require);
        cb(null, releaseLibs);
      });
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
