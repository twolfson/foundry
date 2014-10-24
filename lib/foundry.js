// Load in dependencies
var path = require('path');
var util = require('util');
var chalk = require('chalk');
var Command = require('commander-completion').Command;
var extend = require('obj-extend');
var glob = require('glob');
var Release = require('./release');

function Foundry() {
  // Set up program
  Command.apply(this, arguments);

  // Bind our commands
  this.bindCommands();
}
Foundry.Release = Release;
Foundry.getReleaseLibs = function (params, cb) {
  // Find all packages local to `foundry` directory
  // DEV: This behavior will support both local and global foundry installations
  var that = this;
  var pluginDir = params.pluginDir || __dirname + '/../../';
  glob('*/package.json', {cwd: pluginDir}, function handlePackageJsons (err, pkgPaths) {
    // If there was an error, callback with it
    if (err) {
      return cb(err);
    }

    // Convert all package paths into absolute paths
    var absolutePkgPaths = pkgPaths.map(function (pkgPath) {
      return path.resolve(pluginDir, pkgPath);
    });

    // Filter out `foundry-release` packages
    var releasePkgPaths = absolutePkgPaths.filter(function (pkgPath) {
      var pkg = require(pkgPath);
      var keywords = pkg.keywords || [];
      return keywords.indexOf('foundry-release') !== -1;
    });

    // Load in the libraries and their metadata
    var releaseLibs = releasePkgPaths.map(function (pkgPath) {
      // Load in metadata and the package
      var pkg = require(pkgPath);
      var releaseDir = path.dirname(pkgPath);
      var releaseLib = require(releaseDir);

      // Save the metadata to the package and return
      releaseLib._name = pkg.name || releaseDir;
      releaseLib._version = pkg.version;
      releaseLib._meta = pkg;
      return releaseLib;
    });
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
      .option('--plugin-dir <directory>', 'Directory to load plugins from. Should have same structure as `node_modules`');

    program
      .command('release <version>')
      .description('Update package metadata and publish to registries')
      .action(function callRelease (version, argv) {
        // Gather release libs
        Foundry.getReleaseLibs({
          pluginDir: argv.parent.pluginDir
        }, function handleReleaseLibs (err, releaseLibs) {
          // If there was an error, throw it
          if (err) {
            throw err;
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

    program
      .command('plugins')
      .description('List installed `foundry` plugins')
      .action(function listPlugins (argv) {
        // Gather release directories
        Foundry.getReleaseLibs({
          pluginDir: argv.parent.pluginDir
        }, function handleReleaseLibs (err, releaseLibs) {
          // If there was an error, throw it
          if (err) {
            throw err;
          }

          // Otherwise, output the names of the plugins
          if (releaseLibs.length === 0) {
            console.log('No `foundry` plugins are installed currently. You can find plugins at: https://www.npmjs.org/browse/keyword/foundry-release');
            return;
          }
          console.log(chalk.bold('Installed `foundry` plugins:'));
          releaseLibs.forEach(function outputReleaseLib (releaseLib) {
            console.log('- ' + releaseLib._name + '@' + releaseLib._version);
          });
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
