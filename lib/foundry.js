// Load in dependencies
var util = require('util');
var Command = require('commander-completion').Command;
var extend = require('obj-extend');
var Release = require('./release');

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
    var program = this;
    var that = this;
    program
      .command('release <version>')
      .description('Set version for package.json, bower, component, git tag, and setup.py and publish to corresponding registries')
      .action(function callRelease (version, argv) {
        var release = new Release(argv);

        // TODO: This is only being used for tests. Please nuke when all modules are extracted.
        release.on('setVersion#before', function () { that.emit('setVersion#before'); });
        release.on('setVersion#after', function () { that.emit('setVersion#after'); });
        release.on('commit#before', function () { that.emit('commit#before'); });
        release.on('commit#after', function () { that.emit('commit#after'); });
        release.on('register#before', function () { that.emit('register#before'); });
        release.on('register#after', function () { that.emit('register#after'); });
        release.on('publish#before', function () { that.emit('publish#before'); });
        release.on('publish#after', function () { that.emit('publish#after'); });

        release.release(version, function handleError (err) {
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
  }
});
module.exports = Foundry;
