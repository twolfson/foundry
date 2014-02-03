// Load in dependencies
var path = require('path');
var util = require('util');
var async = require('async');
var glob = require('glob');
var Command = require('commander-completion').Command;
var extend = require('obj-extend');
var npm = require('npm');
var shell = require('shelljs');

function Foundry() {
  // Set up program
  Command.apply(this, arguments);

  // Bind our commands
  this.bindCommands();
}
util.inherits(Foundry, Command);
extend(Foundry.prototype, {
  name: 'foundry',
  bindCommands: function () {
    // Set up commands
    // TODO: Following iterations ($EDITOR for message, try to update changelog)
    var program = this;
    var that = this;
    program
      .command('release <version>')
      .description('Set version for package.json, bower, component, git tag, and setup.py and publish to corresponding registries')
      .action(function callRelease (version, argv) {
        that.release(version, function handleError (err) {
          if (err) {
            throw err;
          }
        });
      });

    // TODO: Move this into its own node module
    program
      .command('completion')
      .description('Get potential completions for a command. Looks for `COMP_CWORD`, `COMP_LINE`, `COMP_POINT`.')
      .action(function completeLine (/* word1, word2, ..., argv */) {
        // Run completion against environment variables
        program.complete({
          line: process.env.COMP_LINE,
          cursor: process.env.COMP_POINT
        });
      });
  },

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
        that.emit('setVersion#before');
        that.setVersion(params, cb);
      },
      function registerFn (cb) {
        that.emit('setVersion#after');
        // Only run register if we are at the 'register' semver (e.g. 0.1.0)
        // TODO: Make this a config setting
        if (version === '0.1.0') {
          that.emit('register#before');
          that.register(params, cb);
        } else {
          process.nextTick(cb);
        }
      },
      function publishFn (cb) {
        if (version === '0.1.0') {
          that.emit('register#after');
        }
        that.emit('publish#before');
        that.publish(params, cb);
      },
      function afterPublishFn (cb) {
        that.emit('publish#after');
        cb();
      }
    ], cb);
  },

  getReleaseLibs: function (cb) {
    // Load up npm
    npm.load(function (err) {
      // If there was an error, callback with it
      if (err) {
        return cb(err);
      }

      // Find all global packages
      glob('*/package.json', {cwd: npm.globalDir}, function (err, packages) {
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

        // Return our list of them
        var releaseDirs = releasePackages.map(path.dirname);
        var releaseLibs = releaseDirs.map(require);
        cb(null, releaseLibs);
      });
    });
  },

  setVersion: function (params, cb) {
    this.getReleaseLibs(function (err, releaseLibs) {
      if (err) { return cb(err); }
      async.forEach(releaseLibs, function setVersionFn (release, cb) {
        if (release.setVersion) {
          release.setVersion(params, cb);
        } else {
          process.nextTick(cb);
        }
      }, cb);
    });
  },
  register: function (params, cb) {
    this.getReleaseLibs(function (err, releaseLibs) {
      if (err) { return cb(err); }
      async.forEach(releaseLibs, function registerFn (release, cb) {
        if (release.register) {
          release.register(params, cb);
        } else {
          process.nextTick(cb);
        }
      }, cb);
    });
  },
  publish: function (params, cb) {
    this.getReleaseLibs(function (err, releaseLibs) {
      if (err) { return cb(err); }
      async.forEach(releaseLibs, function publishFn (release, cb) {
        if (release.publish) {
          release.publish(params, cb);
        } else {
          process.nextTick(cb);
        }
      }, cb);
    });
  }
});
module.exports = Foundry;
