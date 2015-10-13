// Load in dependencies
var _ = require('underscore');
var assert = require('assert');
var bufferedSpawn = require('buffered-spawn');
var spawn = require('child_process').spawn;
var async = require('async');
var Chalk = require('chalk').constructor;

// Define constants for our environment variables
var FOUNDRY_VERSION_VAR = '$FOUNDRY_VERSION';
var FOUNDRY_MESSAGE_VAR = '$FOUNDRY_MESSAGE';
if (process.platform === 'win32') {
  FOUNDRY_VERSION_VAR = '%FOUNDRY_VERSION%';
  FOUNDRY_MESSAGE_VAR = '%FOUNDRY_MESSAGE%';
}

// Define a class to wrap release internals
function Release(releaseCommands, options) {
  // Assert against releaseCommands
  if (!Array.isArray(releaseCommands)) {
    throw new Error('foundry expected `releaseCommands` to be an array. Received: ' + JSON.stringify(releaseCommands));
  }

  // Upcast our releaseCommands from strings to objects
  // TODO: If these one-offs for `releaseCommand` become unwieldy, consider writing a `ReleaseCommand` class
  //   with abstractions for `updateFiles`/etc and `specVersion`
  releaseCommands = releaseCommands.map(function upcastReleaseCommand (releaseCommand) {
    if (typeof releaseCommand === 'string') {
      return {
        type: 'releaseCommand',
        command: releaseCommand
      };
    } else {
      return releaseCommand;
    }
  });

  // Validate each of our command types
  releaseCommands.forEach(function validateReleaseCommand (releaseCommand) {
    if (releaseCommand.type === 'releaseCommand') {
      assert(releaseCommand.command, 'Expected `releaseCommand.command` to be defined but it was not. ' +
        'Received: ' + JSON.stringify(releaseCommand));
    } else if (releaseCommand.type === 'customCommand') {
      // Verify any of `updateFiles`, `commit`, `register`, or `publish`
      var hasValidCommand = Release.STEPS.some(function verifyStepExists (step) {
        return releaseCommand[step];
      });
      assert(hasValidCommand, 'Expected `customCommand` to have command for `updateFiles`, `commit`, `publish`, ' +
        'or `register` but none were defined. Received: ' + JSON.stringify(releaseCommand));
    } else {
      assert.fail('Unknown `releaseCommand.type` found, expected `releaseCommand` or `customCommand`. ' +
        'Received: ' + JSON.stringify(releaseCommand));
    }
  });

  // Define commands for our release commands to have a consistent API with custom commands
  releaseCommands = releaseCommands.map(function upcastReleaseCommand (releaseCommand) {
    if (releaseCommand.type === 'releaseCommand') {
      var command = releaseCommand.command;
      return _.defaults({}, releaseCommand, {
        // Example: foundry-release-npm update-files "$FOUNDRY_VERSION" "$FOUNDRY_MESSAGE"
        // DEV: We use only string concatenation for the later parts since `shell-quote` won't work for Windows
        updateFiles: command + ' update-files "' + FOUNDRY_VERSION_VAR + '" "' + FOUNDRY_MESSAGE_VAR + '"',
        commit: command + ' commit "' + FOUNDRY_VERSION_VAR + '" "' + FOUNDRY_MESSAGE_VAR + '"',
        publish: command + ' publish "' + FOUNDRY_VERSION_VAR + '" "' + FOUNDRY_MESSAGE_VAR + '"',
        register: command + ' register "' + FOUNDRY_VERSION_VAR + '" "' + FOUNDRY_MESSAGE_VAR + '"'
      });
    } else {
      return releaseCommand;
    }
  });

  // Save releaseCommands and options for later
  this.releaseCommands = releaseCommands;
  this.options = options || {};
  this.stdout = this.options.stdout || process.stdout;
  this.customStdout = !!this.options.stdout;
  this.chalk = new Chalk({enabled: this.options.color});
}
Release.STEPS = ['updateFiles', 'commit', 'publish', 'register'];
Release.specVersion = '2.0.0';
Release.prototype = {
  validateSpecVersion: function (callback) {
    var releaseCommands = this.releaseCommands;
    async.map(releaseCommands, function getSpecVersion (releaseCommand, cb) {
      // If the command is a release command, get the version
      //   e.g.: foundry-release-git --spec-version
      if (releaseCommand.type === 'releaseCommand') {
        bufferedSpawn(releaseCommand.command, ['--spec-version'], function handleSpecVersion (err, stdout, stderr) {
          // If there was an error
          if (err) {
            // If there was stderr, callback with it as our error
            if (stderr) {
              return cb(new Error(stderr));
            // Otherwise, callback with our error
            } else {
              return cb(err);
            }
          // Otherwise, callback with a trimmed stdout (removes any newlines)
          } else {
            return cb(null, stdout.trim());
          }
        });
      // Otherwise, assume it's foundry's version
      } else {
        process.nextTick(function replyWithFoundrySpecVersion () {
          cb(null, Release.specVersion);
        });
      }
    }, function handleSpecVersions (err, specVersions) {
      // If there was an error for any command, callback with it
      if (err) {
        return callback(err);
      }

      // Otherwise, validate our spec versions
      var i = 0;
      var len = specVersions.length;
      for (; i < len; i++) {
        // If the specVersion doesn't line up, error out with library info
        var specVersion = specVersions[i];
        if (specVersion !== Release.specVersion) {
          var releaseCommand = releaseCommands[i];
          return callback(new Error('Expected release command "' + releaseCommand.command +
            '" to have a `--spec-version` of "' + Release.specVersion + '" but it was "' + specVersion + '"'));
        }
      }

      // Callback with no error
      return callback(null);
    });
  },

  release: function (version, callback) {
    var that = this;
    var params = {
      version: version,
      message: 'Release ' + version
    };
    async.series([
      function validateSpecVersionFn (cb) {
        that.validateSpecVersion(cb);
      },
      function notifyUserReleaseSteps (cb) {
        var stdout = that.stdout;
        var chalk = that.chalk;
        stdout.write('Configuring steps with ' + chalk.bold('FOUNDRY_VERSION') + ': ' + params.version + '\n');
        stdout.write('Configuring steps with ' + chalk.bold('FOUNDRY_MESSAGE') + ': ' + params.message + '\n');
        process.nextTick(cb);
      },
      function updateFilesFn (cb) {
        that.updateFiles(params, cb);
      },
      function commitFn (cb) {
        that.commit(params, cb);
      },
      function registerFn (cb) {
        // Only run register if we are at the 'register' semver (e.g. 1.0.0)
        if (version === '1.0.0') {
          that.register(params, cb);
        } else {
          process.nextTick(cb);
        }
      },
      function publishFn (cb) {
        that.publish(params, cb);
      }
    ], callback);
  },

  _runReleaseStep: function (step, params, callback) {
    var that = this;
    async.eachSeries(this.releaseCommands, function _runReleaseCommandFn (releaseCommand, cb) {
      // If there is a command for this step
      if (releaseCommand[step]) {
        // Log the step we are running
        var cmd = releaseCommand[step];
        var stdout = that.stdout;
        var chalk = that.chalk;
        stdout.write(chalk.green('Running step') + ': ' + cmd + '\n');

        // Prepare our command environment
        var cmdEnv = _.defaults({
          FOUNDRY_VERSION: params.version,
          FOUNDRY_MESSAGE: params.message
        }, process.env);
        // DEV: We conditionally use 'pipe' on `stdout` to allow for buffering during testing
        var stdio = [process.stdin, that.customStdout ? 'pipe' : stdout, process.stderr];
        var conf = {stdio: stdio, env: cmdEnv};

        // Prepare the command itself
        // DEV: We use `sh` or `cmd` to support interpretting environment variables like `npm run-script`
        // https://github.com/npm/npm/blob/v3.3.6/lib/utils/lifecycle.js#L210-L225
        // DEV: `-c` means command
        var sh = 'sh';
        var shFlag = '-c';
        if (process.platform === 'win32') {
          sh = process.env.comspec || 'cmd';
          // DEV: `/d` disables AutoRun command execution
          // DEV: `/s /c` means use the following command as is
          //   https://www.microsoft.com/resources/documentation/windows/xp/all/proddocs/en-us/cmd.mspx?mfr=true
          shFlag = '/d /s /c';
          conf.windowsVerbatimArguments = true;
        }

        // If we aren't on a dry run
        if (!that.options.dryRun) {
          // Run our command and pipe stdout if appropriate
          var child = spawn(sh, [shFlag, cmd], conf);
          if (that.customStdout) {
            child.stdout.on('data', function writeToStdout (data) {
              stdout.write(data);
            });
            child.stdout.on('error', function forwardErrorToStdout (err) {
              stdout.emit('error', err);
            });
          }

          // When the child exits, handle its exit code
          child.on('close', function handleChildClose (code) {
            // If the exit code was not zero, complain and leave
            if (code !== 0) {
              cb(new Error('Received non-zero exit code "' + code + '" from command "' + cmd + '"'));
            // Otherwise, do nothing
            } else {
              cb(null);
            }
          });
        // Otherwise, callback shortly
        } else {
          process.nextTick(cb);
        }
      // Otherwise, do nothing
      } else {
        process.nextTick(cb);
      }
    }, callback);
  },

  updateFiles: function (params, cb) {
    this._runReleaseStep('updateFiles', params, cb);
  },
  commit: function (params, cb) {
    this._runReleaseStep('commit', params, cb);
  },
  register: function (params, cb) {
    this._runReleaseStep('register', params, cb);
  },
  publish: function (params, cb) {
    this._runReleaseStep('publish', params, cb);
  }
};

// Export Release
module.exports = Release;
