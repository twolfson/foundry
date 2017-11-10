// Load in dependencies
var assert = require('assert');
var fs = require('fs');
var spawn = require('child_process').spawn;
var util = require('util');
var _ = require('underscore');
var async = require('async');
var bufferedSpawn = require('buffered-spawn');
var Chalk = require('chalk').constructor;
var deepEqual = require('deep-equal');

// Define constants for our environment variables
var FOUNDRY_VERSION_KEY = 'FOUNDRY_VERSION';
var FOUNDRY_MESSAGE_KEY = 'FOUNDRY_MESSAGE';
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
  releaseCommands = releaseCommands.map(function upcastReleaseCommand(releaseCommand) {
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
  releaseCommands.forEach(function validateReleaseCommand(releaseCommand) {
    if (releaseCommand.type === 'releaseCommand') {
      assert(releaseCommand.command, 'Expected `releaseCommand.command` to be defined but it was not. ' +
        'Received: ' + JSON.stringify(releaseCommand));
    } else if (releaseCommand.type === 'customCommand') {
      // Verify any of `updateFiles`, `commit`, `register`, or `publish`
      var hasValidCommand = Release.STEPS.some(function verifyStepExists(step) {
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
  releaseCommands = releaseCommands.map(function upcastReleaseCommand(releaseCommand) {
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

  // Save releaseCommands for later
  this.releaseCommands = releaseCommands;

  // Process all of our options
  this.options = options || {};
  this.registerVersion = this.options.registerVersion || Release.registerVersion;
  this.stdout = this.options.stdout || process.stdout;
  this.customStdout = !!this.options.stdout;
  this.stderr = this.options.stderr || process.stderr;
  this.customStderr = !!this.options.stderr;
  this.chalk = new Chalk({enabled: this.options.color});
}
Release.RESUME_FILE = 'foundry-resume.json';
Release.STEPS = ['updateFiles', 'commit', 'publish', 'register'];
// DEV: We choose `1.0.0` to be our register version to avoid the confusion
//   that comes from `0.x.y` being allowed to introduce breaking changes
Release.registerVersion = '1.0.0';
Release.specVersion = '2.0.0';
Release.readResumeFile = function (callback) {
  fs.readFile(Release.RESUME_FILE, 'utf8', callback);
};
Release.writeResumeFile = function (content, callback) {
  fs.writeFile(Release.RESUME_FILE, content, callback);
};
Release.prototype = {
  validateSpecVersion: function (callback) {
    var releaseCommands = this.releaseCommands;
    async.map(releaseCommands, function getSpecVersion(releaseCommand, cb) {
      // If the command is a release command, get the version
      //   e.g.: foundry-release-git --spec-version
      if (releaseCommand.type === 'releaseCommand') {
        bufferedSpawn(releaseCommand.command, ['--spec-version'], function handleSpecVersion(err, stdout, stderr) {
          // If there was an error
          if (err) {
            // If the command wasn't found, generate a better error
            if (err.code === 'ENOENT') {
              return cb(new Error('Attempted to run "' + releaseCommand.command + ' --spec-version" ' +
                'but it wasn\'t found. Please verify your dependencies are installed ' +
                'and the PATH environment variables are set up properly'));
            // Otherwise if there was stderr, callback with it as our error
            } else if (stderr) {
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
        return process.nextTick(function replyWithFoundrySpecVersion() {
          cb(null, Release.specVersion);
        });
      }
    }, function handleSpecVersions(err, specVersions) {
      // If there was an error for any command, callback with it
      if (err) {
        return callback(err);
      }

      // Otherwise, validate our spec versions
      var i = 0;
      var len = specVersions.length;
      for (; i < len; i += 1) {
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

  getReleaseSteps: function (params) {
    // Generate a container for our steps
    var steps = [];
    var that = this;

    // For each of step keys, add their respective steps
    function addSteps(stepKey) {
      that.releaseCommands.forEach(function addReleaseStep(releaseComand) {
        if (releaseComand[stepKey]) {
          steps.push({
            step: releaseComand[stepKey],
            completed: false
          });
        }
      });
    }
    addSteps('updateFiles');
    addSteps('commit');
    // Only run register if we are at the 'register' semver (e.g. 1.0.0)
    if (params[FOUNDRY_VERSION_KEY] === this.registerVersion) {
      addSteps('register');
    }
    addSteps('publish');

    // Return our steps
    return steps;
  },

  notifyUserReleaseSteps: function (params) {
    var stdout = this.stdout;
    var chalk = this.chalk;
    stdout.write(
      'Configuring steps with ' + chalk.bold('FOUNDRY_VERSION') + ': ' + params[FOUNDRY_VERSION_KEY] + '\n');
    stdout.write(
      'Configuring steps with ' + chalk.bold('FOUNDRY_MESSAGE') + ': ' + params[FOUNDRY_MESSAGE_KEY] + '\n');
  },

  release: function (version, callback) {
    var that = this;
    var params = {
      FOUNDRY_VERSION: version,
      FOUNDRY_MESSAGE: 'Release ' + version
    };
    async.series([
      function validateSpecVersionFn(cb) {
        that.validateSpecVersion(cb);
      },
      function prepareReleaseSteps(cb) {
        params.steps = that.getReleaseSteps(params);
        process.nextTick(cb);
      },
      function notifyUserReleaseSteps(cb) {
        that.notifyUserReleaseSteps(params);
        process.nextTick(cb);
      },
      function runReleaseSteps(cb) {
        that._runReleaseSteps(params, cb);
      }
    ], callback);
  },

  resume: function (params, callback) {
    var that = this;
    async.series([
      function validateSpecVersionFn(cb) {
        that.validateSpecVersion(cb);
      },
      function validateParams(cb) {
        // If there is no version nor message, error out
        if (params[FOUNDRY_VERSION_KEY] === undefined) {
          return cb(new Error('Expected `' + FOUNDRY_VERSION_KEY + '` to be defined in `' +
            Release.RESUME_FILE + '` but it was not.'));
        }
        if (params[FOUNDRY_MESSAGE_KEY] === undefined) {
          return cb(new Error('Expected `' + FOUNDRY_MESSAGE_KEY + '` to be defined in `' +
            Release.RESUME_FILE + '` but it was not.'));
        }

        // Verify our steps line up exactly (order and properties)
        var configSteps = that.getReleaseSteps(params);
        var resumeSteps = params.steps;
        var incompleteResumeSteps = resumeSteps.map(function normalizeCompletedProperties(step) {
          step = _.clone(step);
          // DEV: We are overly protective of our properties changing to ensure the tests fail when appropriate
          if (step.hasOwnProperty('completed')) {
            step.completed = false;
          }
          return step;
        });
        if (!deepEqual(incompleteResumeSteps, configSteps)) {
          return cb(new Error(
            'Expected `foundry-resume.json` and `.foundryrc/package.json` commands to line up exactly. ' +
            'Please do not adjust `foundry` configuration nor `foundry-resume.json`. ' +
            'Otherwise, the release will be terminate in an incomplete state.'));
        }
        process.nextTick(cb);
      },
      function notifyUserReleaseSteps(cb) {
        that.notifyUserReleaseSteps(params);
        process.nextTick(cb);
      },
      function runReleaseSteps(cb) {
        that._runReleaseSteps(params, cb);
      }
    ], callback);
  },

  _runReleaseSteps: function (params, callback) {
    var that = this;
    async.eachSeries(params.steps, function _runReleaseStepFn(stepInfo, cb) {
      // Localize common step variables
      var cmd = stepInfo.step;
      var stdout = that.stdout;
      var stderr = that.stderr;
      var chalk = that.chalk;

      // If the step has already been completed, skip it
      if (stepInfo.completed) {
        stdout.write(chalk.green('Step already complete') + ': ' + cmd + '\n');
        return process.nextTick(cb);
      }

      // Log the step we are running
      stdout.write(chalk.green('Running step') + ': ' + cmd + '\n');

      // Prepare our command environment
      var cmdEnv = _.defaults(_.object([
        [FOUNDRY_VERSION_KEY, params[FOUNDRY_VERSION_KEY]],
        [FOUNDRY_MESSAGE_KEY, params[FOUNDRY_MESSAGE_KEY]]
      ]), process.env);
      // DEV: We conditionally use 'pipe' on `stdout` to allow for buffering during testing
      var stdio = [process.stdin, that.customStdout ? 'pipe' : stdout, that.customStderr ? 'pipe' : stderr];
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
          child.stdout.on('data', function writeToStdout(data) {
            stdout.write(data);
          });
          child.stdout.on('error', function forwardErrorToStdout(err) {
            stdout.emit('error', err);
          });
        }
        if (that.customStderr) {
          child.stderr.on('data', function writeToStdout(data) {
            stderr.write(data);
          });
          child.stderr.on('error', function forwardErrorToStdout(err) {
            stderr.emit('error', err);
          });
        }

        // When the child exits, handle its exit code
        child.on('close', function handleChildClose(code) {
          // If the exit code was not zero, complain and leave
          if (code !== 0) {
            return cb(new Error('Received non-zero exit code "' + code + '" from command "' + cmd + '"'));
          // Otherwise, mark the step as a success and continue
          } else {
            stepInfo.completed = true;
            return cb(null);
          }
        });
      // Otherwise, callback shortly
      } else {
        return process.nextTick(cb);
      }
    }, function handleFailure(err) {
      // If this is a dry run, callback with the error
      if (that.options.dryRun) {
        return callback(err);
      }

      // If there was an error, output our progress to a file
      if (err) {
        // Output our error immediately
        // TODO: Figure out way to stack/concatenate errors instead of using `console.error`
        that.stderr.write('There was an error while executing a command\n');
        that.stderr.write(util.inspect(err));

        // Output params to disk in verbatim fashion
        var content = JSON.stringify(params, null, 2);
        Release.writeResumeFile(content, function handleOutputResumeFile(err2) {
          // If there was a secondary error, callback with it
          if (err2) {
            // TODO: Figure out way to stack/concatenate errors instead of using `console.error`
            that.stderr.write('Attempted to write `' + Release.RESUME_FILE + '` but failed\n');
            return callback(err2);
          }

          // Callback with an error about running resume
          callback(new Error('We have generated a `' + Release.RESUME_FILE + '` file. ' +
            'Once issues have been resolved, the current release can be resumed by running `foundry resume`.'));
        });
      // Otherwise, attempt to clean up resume file
      // DEV: This also covers the scenario where a release fails and then someone re-runs `release`
      } else {
        // DEV: We don't use `stat` + `unlink` since the file could be created in that time
        fs.unlink(Release.RESUME_FILE, function handleError(err) {
          // If there was an error about the file not existing, nullify it
          if (err && err.code === 'ENOENT') {
            err = null;
          }

          // Callback with our error
          callback(err);
        });
      }
    });
  }
};

// Export Release
module.exports = Release;
