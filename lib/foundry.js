// Load in dependencies
var util = require('util');
var async = require('async');
var extend = require('obj-extend');
var shell = require('shelljs');

var Command = require('commander-completion').Command;

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
    async.series([
      function setVersionFn (cb) {
        that.emit('setVersion#before');
        that.setVersion(version, cb);
      },
      function registerFn (cb) {
        that.emit('setVersion#after');
        // Only run register if we are at the 'register' semver (e.g. 0.1.0)
        // TODO: Make this a config setting
        if (version === '0.1.0') {
          that.emit('register#before');
          that.register(version, cb);
        } else {
          process.nextTick(cb);
        }
      },
      function publishFn (cb) {
        if (version === '0.1.0') {
          that.emit('register#after');
        }
        that.emit('publish#before');
        that.publish(version, cb);
      },
      function afterPublishFn (cb) {
        that.emit('publish#after');
        cb();
      }
    ], cb);
  },

  getReleaseLibs: function (cb) {
    // TODO: Use readdir + require
    var releaseLibs = [
      require('./release/git'),
      require('./release/npm'),
      require('./release/bower'),
      require('./release/component'),
      require('./release/python')
    ];
    cb(null, releaseLibs);
  },

  setVersion: function (version, cb) {
    this.getReleaseLibs(function (err, releaseLibs) {
      if (err) { return cb(err); }
      async.forEach(releaseLibs, function setVersionFn (release, cb) {
        if (release.setVersion) {
          release.setVersion(version, cb);
        } else {
          process.nextTick(cb);
        }
      }, cb);
    });
  },
  register: function (version, cb) {
    this.getReleaseLibs(function (err, releaseLibs) {
      if (err) { return cb(err); }
      async.forEach(releaseLibs, function registerFn (release, cb) {
        if (release.register) {
          release.register(version, cb);
        } else {
          process.nextTick(cb);
        }
      }, cb);
    });
  },
  publish: function (version, cb) {
    this.getReleaseLibs(function (err, releaseLibs) {
      if (err) { return cb(err); }
      async.forEach(releaseLibs, function publishFn (release, cb) {
        if (release.publish) {
          release.publish(version, cb);
        } else {
          process.nextTick(cb);
        }
      }, cb);
    });
  }
});
module.exports = Foundry;
