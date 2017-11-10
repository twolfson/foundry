/* eslint consistent-this: ["warn", "that", "program"] */
// Load in dependencies
var fs = require('fs');
var util = require('util');
var _ = require('underscore');
var async = require('async');
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
  var source, content;
  async.series([
    function attemptToLoadFoundryRc(cb) {
      // Load in our `.foundryrc` (relative to cwd)
      // DEV: We use `readFile` instead of `stat` + `readFile` to prevent the file descriptor from changing
      //   Most likely overkill but it also simplifies the code
      fs.readFile('.foundryrc', 'utf8', function handleFoundryrc(err, _content) {
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
    function attemptToLoadJson(cb) {
      // If we already have content, continue
      if (content) {
        return cb();
      }

      // Load in our `package.json` (relative to cwd)
      fs.readFile('package.json', 'utf8', function handlePackageJson(err, _content) {
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
  ], function handleContent(err) {
    // If there was no file anywhere, provide a useful message
    if (err && err.code === 'ENOENT') {
      return callback(new Error('Failed to find a `.foundryrc` or `package.json` file. ' +
        'Please run `foundry` in the same working directory as these files. ' +
        'We enforce this to guarantee steps are given the proper context.'));
    // Otherwise, callback with any other error
    } else if (err) {
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

    program
      .command('release <version>')
      .description('Update package metadata and publish to registries')
      .option('-n, --dry-run', 'Output steps but don\'t execute them')
      .option('--no-color', 'Removed color from output')
      .action(function callRelease(version, argv) {
        // Gather configuration for `foundry`
        Foundry.getConfig({}, function handleReleaseLibs(err, config) {
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
          var release = new Release(config.releaseCommands, _.extend({
            registerVersion: config.registerVersion
          }, argv));
          release.release(version, function handleError(err) {
            if (err) {
              throw err;
            }
          });
        });
      });

    program
      .command('resume')
      .description('Resume an incomplete release')
      .option('-n, --dry-run', 'Output steps but don\'t execute them')
      .option('--no-color', 'Removed color from output')
      .action(function callResume(argv) {
        // Gather configuration for `foundry`
        Foundry.getConfig({}, function handleReleaseLibs(err, config) {
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

          // Initialize our release library (catches any issues with `package.json`)
          var release = new Release(config.releaseCommands, _.extend({
            registerVersion: config.registerVersion
          }, argv));

          // Gather past release information
          Release.readResumeFile(function handleResumeFile(err, content) {
            // If there was an error, throw it
            if (err) {
              throw err;
            }

            // Parse our JSON (might throw but that's fine)
            var resumeParams = JSON.parse(content);

            // Resume our release
            release.resume(resumeParams, function handleError(err) {
              if (err) {
                throw err;
              }
            });
          });
        });
      });

    program
      .command('commands')
      .description('List commands used by current package')
      .action(function listConfiguration(argv) {
        // Gather configuration for `foundry`
        Foundry.getConfig({}, function handleReleaseLibs(err, config) {
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
          // eslint-disable-next-line array-callback-return
          var infoStr = release.releaseCommands.map(function formatReleaseCommand(releaseCommand) {
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
          // eslint-disable-next-line no-console
          console.log(infoStr);
        });
      });

    program
      .command('completion')
      .description('Get potential completions for a command. Looks for `COMP_CWORD`, `COMP_LINE`, `COMP_POINT`.')
      .action(function completeLine(/* word1, word2, ..., argv */) {
        // Run completion against environment variables
        program.complete({
          line: process.env.COMP_LINE,
          cursor: process.env.COMP_POINT
        });
      });
  }
});
module.exports = Foundry;
