// Load in dependencies
var fs = require('fs');
var util = require('util');
var _ = require('underscore');
var Command = require('commander-completion').Command;
var Release = require('./release');

function Foundry() {
  // Set up program
  Command.apply(this, arguments);

  // Bind our commands
  this.bindCommands();
}
Foundry.Release = Release;
Foundry.getConfig = function (params, callback) {
  // In series
  var source;
  var content;
  async.series([
    function attemptToLoadFoundryRc (cb) {
      // Load in our `.foundryrc` (relative to cwd)
      // DEV: We use `readFile` instead of `stat` + `readFile` to prevent the file descriptor from changing
      //   Most likely overkill but it also simplifies the code
      fs.readFile('.foundryrc', 'utf8', function handleFoundryrc (err, _content) {
        // If there was no file, continue to `package.json` resolution
        if (err && err.code === 'ENOENT') {
          return cb();
        // Otherwise if there was any other error, callback with the error
        } else if (err) {
          return cb(err);
        // Otherwise, save the content and continue
        } else {
          source = '.foundryrc';
          content = _content;
          return cb();
        }
      });
    },
    function attemptToLoadJson (cb) {
      // Load in our `package.json` (relative to cwd)
      fs.readFile('package.json', 'utf8', function handlePackageJson (err, _content) {
        // If there was an error, callback with it
        if (err) {
          return cb(err);
        // Otherwise, save our content and continue
        } else {
          source = 'package.json';
          content = _content;
          return cb();
        }
      });
    }
  ], function handleContent (err) {
    // If there was an error, callback with it
    if (err) {
      return callback(err);
    }

    // Otherwise, attempt to parse the JSON
    var pkg;
    try {
      pkg = JSON.parse(content);
    } catch (err2) {
      return callback(err2);
    }

    // Extract foundry configuration from `package.json`
    var config = pkg;
    if (source === 'package.json') {
      config = pkg.foundry;
      if (!config) {
        return callback(new Error('No `foundry` field found in `package.json`'));
      }
    }

    // Callback with our config
    return callback(null, config);
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

          // Parse the commands into full objects
          var release = new Release(config.releaseCommands, argv);

          // List our the commands provided
          var infoStr = release.releaseCommands.map(function formatReleaseCommand (releaseCommand) {
            if (releaseCommand.type === 'releaseCommand') {
              // Example: `- foundry-release-echo`
              return '- ' + releaseCommand.command;
            } else if (releaseCommand.type === 'customCommand') {
              // Example: `- <Custom command>\n    - updateFiles: echo hi`
              return [
                '- <Custom command>',
                releaseCommand.updateFiles ? '    - updateFiles: ' + releaseCommand.updateFiles : null,
                releaseCommand.commit ? '    - commit: ' + releaseCommand.commit : null,
                releaseCommand.register ? '    - register: ' + releaseCommand.register : null,
                releaseCommand.publish ? '    - publish: ' + releaseCommand.publish : null
              // DEV: We use filter to remove `null` lines
              ].filter(Boolean).join('\n');
            }
          }).join('\n');
          console.log(infoStr);
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
