// Load in dependencies
var util = require('util');
var async = require('async');
var extend = require('obj-extend');
var shell = require('shelljs');
var setVersion = require('./set-version');
var register = require('./register');
var publish = require('./publish');

// TODO: Move all CLI logic into a `lib` (even though a lot of this is going to get broken down)
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
        // TODO: Only run register if we are at the 'register' semver (e.g. 0.1.0)
        // TODO: Definitely make this a config setting
        that.emit('register#before');
        that.register(version, cb);
      },
      function publishFn (cb) {
        that.emit('register#after');
        that.emit('publish#before');
        that.publish(version, cb);
      },
      function afterPublishFn (cb) {
        that.emit('publish#after');
        cb();
      }
    ], cb);
  },

  setVersion: setVersion,
  register: register,
  publish: publish
});
module.exports = Foundry;
