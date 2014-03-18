// Load in dependencies
var path = require('path');
var util = require('util');
var Command = require('commander-completion').Command;
var extend = require('obj-extend');
var glob = require('glob');
var npm = require('npm');
var Release = require('./release');

function Foundry() {
  // Set up program
  Command.apply(this, arguments);

  // Bind our commands
  this.bindCommands();
}
Foundry.Release = Release;
Foundry.getReleaseDirs = function (params, cb) {
  // Load up npm
  var that = this;
  npm.load(function (err) {
    // If there was an error, callback with it
    if (err) {
      return cb(err);
    }

    // Find all global packages
    var pluginDir = params.pluginDir || npm.globalDir;
    glob('*/package.json', {cwd: pluginDir}, function handlePackageJsons (err, packages) {
      // If there was an error, callback with it
      if (err) {
        return cb(err);
      }

      // Convert all packages into absolute paths
      var absolutePackages = packages.map(function (filepath) {
        return path.resolve(pluginDir, filepath);
      });

      // Filter out `foundry-release` packages
      var releasePackages = absolutePackages.filter(function (filepath) {
        var pkg = require(filepath);
        var keywords = pkg.keywords || [];
        return keywords.indexOf('foundry-release') !== -1;
      });

      // Return the paths to the libraries
      var releaseDirs = releasePackages.map(path.dirname);
      cb(null, releaseDirs);
    });
  });
};
Foundry.getReleaseLibs = function (params, cb) {
  // Load the release directories
  Foundry.getReleaseDirs(params, function handleReleaseDirs (err, releaseDirs) {
    // If there was an error, callback with it
    if (err) {
      return cb(err);
    }

    // Return the libraries
    var releaseLibs = releaseDirs.map(require);
    cb(null, releaseLibs);
  });
};
util.inherits(Foundry, Command);
extend(Foundry.prototype, {
  name: 'foundry',
  bindCommands: function () {
    // Set up commands
    var program = this;
    var that = this;
    program
      .command('release <version>')
      .description('Set version for package metadata and publish to registries')
      .action(function callRelease (version, argv) {
        // Gather release libs
        Foundry.getReleaseLibs({}, function handleReleaseLibs (err, releaseLibs) {
          // If there was an error, throw it
          if (err) {
            throw err;
          // Otherwise, if there were no release libraries found, help the user out
          } else if (releaseLibs.length === 0) {
            throw new Error('No `foundry-release` plugins were found. You can find plugins at: https://www.npmjs.org/browse/keyword/foundry-release');
          }

          // Otherwise, release our package
          var release = new Release(releaseLibs, argv);
          release.release(version, function handleError (err) {
            if (err) {
              throw err;
            }
          });
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
