// Load in dependencies
var util = require('util');
var async = require('async');
var extend = require('obj-extend');
var shell = require('shelljs');
var preRelease = require('./pre-release');
var postRelease = require('./post-release');

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
      function preReleaseFn (cb) {
        that.emit('preRelease#before');
        that.preRelease(version, cb);
      },
      function gitTagFn (cb) {
        that.emit('preRelease#after');
        that.emit('gitTag#before');
        that.gitTag(version, cb);
      },
      function postReleaseFn (cb) {
        that.emit('gitTag#after');
        that.emit('postRelease#before');
        that.postRelease(version, cb);
      },
      function afterPostReleaseFn (cb) {
        that.emit('postRelease#after');
        cb();
      }
    ], cb);
  },

  // TODO: Relocate this to `set-version` as in the grand vision
  gitTag: function gitTag (version, cb) {
    shell.exec('git commit -a -m "Release ' + version + '"');
    shell.exec('git tag ' + version + ' -a -m "Release ' + version + '"');
    shell.exec('git push');
    shell.exec('git push --tags');
    cb();
  },
  preRelease: preRelease,
  postRelease: postRelease
});
module.exports = Foundry;
