// Load in dependencies
var _ = require('underscore');
var assert = require('assert');
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var async = require('async');
var quote = require('shell-quote').quote;

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
      var hasValidCommand = releaseCommand.updateFiles || releaseCommand.commit ||
        releaseCommand.publish || releaseCommand.register;
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
      var quotedCommand = quote([releaseCommand.command]);
      return _.defaults({}, releaseCommand, {
        // Example: "foundry-release-npm" update-files "$FOUNDRY_VERSION" "$FOUNDRY_MESSAGE"
        // DEV: We use only string concatenation for the later parts since `shell-quote` won't work for Windows
        updateFiles: quotedCommand + ' update-files "' + FOUNDRY_VERSION_VAR + '" "' + FOUNDRY_MESSAGE_VAR + '"',
        commit: quotedCommand + ' commit "' + FOUNDRY_VERSION_VAR + '" "' + FOUNDRY_MESSAGE_VAR + '"',
        publish: quotedCommand + ' publish "' + FOUNDRY_VERSION_VAR + '" "' + FOUNDRY_MESSAGE_VAR + '"',
        register: quotedCommand + ' register "' + FOUNDRY_VERSION_VAR + '" "' + FOUNDRY_MESSAGE_VAR + '"'
      });
    } else {
      return releaseCommand;
    }
  });

  // Save releaseCommands and options for later
  this.releaseCommands = releaseCommands;
  this.options = options || {};
}
Release.specVersion = '2.0.0';
Release.prototype = {
  validateSpecVersion: function (callback) {
    var releaseCommands = this.releaseCommands;
    async.map(releaseCommands, function getSpecVersion (releaseCommand, cb) {
      // If the command is a release command, get the version
      //   e.g.: foundry-release-git --spec-version
      if (releaseCommand.type === 'releaseCommand') {
        var cmd = quote([releaseCommand.command, '--spec-version']);
        exec(cmd, function handleSpecVersion (err, stdout, stderr) {
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
            '" to have --spec-version of "' + Release.specVersion + '" but it was "' + specVersion + '"'));
        }
      }

      // Callback with no error
      return callback(null);
    });
  },

  _getStdout: function () {
    return this.options.stdout || process.stdout;
  },

  release: function (version, callback) {
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
      function validateSpecVersionFn (cb) {
        that.validateSpecVersion(cb);
      },
      function notifyUserReleaseSteps (cb) {
        var stdout = that._getStdout();
        stdout.write('Configuring steps with FOUNDRY_VERSION: ' + params.version + '\n');
        stdout.write('Configuring steps with FOUNDRY_MESSAGE: ' + params.message + '\n');
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
        // TODO: Make `1.0.0` as the 'registerVersion' a config setting
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
        var stdout = that._getStdout();
        stdout.write('Running step: ' + cmd + '\n');

        // Prepare our command environment
        var cmdEnv = _.defaults({
          FOUNDRY_VERSION: params.version,
          FOUNDRY_MESSAGE: params.message
        }, process.env);
        // DEV: We conditionally use 'pipe' on `stdout` to allow for buffering during testing
        var stdio = [process.stdin, that.options.stdout ? 'pipe' : stdout, process.stderr];
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

        // Run our command and pipe stdout if appropriate
        var child = spawn(sh, [shFlag, cmd], conf);
        if (that.options.stdout) {
          child.stdout.pipe(stdout);
        }

        // When the child exits, handle its exit code
        child.on('close', function handleChildClose (code) {
          // If the exit code was not zero, complain and leave
          if (code !== 0) {
            cb(new Error('Received non-zero exit code "' + code + '" from command "' + cmd + '"'));
          // Otherwise, do nothing
          } else {
            console.log('cb', cb);
            cb(null);
          }
        });
      // Otherwise, do nothing
      } else {
        process.nextTick(cb);
      }
    // TODO: Upon failure, output a series of commands to resume with
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
