// Load in dependencies
var fs = require('fs');
var util = require('util');
var _ = require('underscore');
var archy = require('archy');
var Command = require('commander-completion').Command;
var Release = require('./release');

function Foundry() {
  // Set up program
  Command.apply(this, arguments);

  // Bind our commands
  this.bindCommands();
}
Foundry.Release = Release;
Foundry.getConfig = function (params, cb) {
  // Load in our `package.json` (relative to cwd)
  fs.readFile('package.json', 'utf8', function handlePackageJson (err, content) {
    // If there was an error, callback with it
    if (err) {
      return cb(err);
    }

    // Otherwise, attempt to parse the JSON
    var pkg;
    try {
      pkg = JSON.parse(content);
    } catch (err2) {
      return cb(err2);
    }

    // Extract foundry configuration from `package.json`
    var config = pkg.foundry;
    if (!config) {
      return cb(new Error('No `foundry` field found in `package.json`'));
    }
    return cb(null, config);
  });
};
util.inherits(Foundry, Command);
_.extend(Foundry.prototype, {
  name: 'foundry',
  bindCommands: function () {
    // Set up commands
    var program = this;
    var that = this;

    program
      .command('release <version>')
      .description('Update package metadata and publish to registries')
      .action(function callRelease (version, argv) {
        // Gather configuration for `foundry`
        Foundry.getConfig({}, function handleReleaseLibs (err, config) {
          // If there was an error, throw it
          if (err) {
            throw err;
          } else if (!config.releaseCommands) {
            throw new Error('No `foundry.releaseCommands` was not defined in our `package.json`. ' +
              'Please list out the commands you would like to use for releases');
          } else if (config.releaseCommands.length === 0) {
            throw new Error('`foundry.releaseCommands` was found but empty in our `package.json`. ' +
              'Please list out the commands you would like to use for releases');
          }

          // Otherwise, release our package
          var release = new Release(releaseCommands, argv);
          release.release(version, function handleError (err) {
            if (err) {
              throw err;
            }
          });
        });
      });

    program
      .command('commands')
      .description('List commands `foundry` is configured with')
      .action(function listConfiguration (argv) {
        // Gather configuration for `foundry`
        Foundry.getConfig({}, function handleReleaseLibs (err, config) {
          // If there was an error, throw it
          if (err) {
            throw err;
          } else if (!config.releaseCommands) {
            throw new Error('No `foundry.releaseCommands` was not defined in our `package.json`. ' +
              'Please list out the commands you would like to use for releases');
          }

          // List our the commands provided
          // TODO: Normalize `releaseCommand` into a string?
          console.log(archy({
            label: process.cwd(),
            nodes: config.releaseCommands
          }));
        });
      });

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
