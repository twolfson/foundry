// Load in dependencies
var path = require('path');
var bufferedSpawn = require('buffered-spawn');

// Define our utilities
exports.addToPath = function (dir) {
  before(function addToPathFn() {
    // Save the current PATH for later
    this._pathStack = this.pathStack || [];
    this._pathStack.push(process.env.PATH);

    // Prepend the new directory to the PATH so it's hit first
    process.env.PATH = dir + path.delimiter + process.env.PATH;
  });
  after(function restorePath() {
    // Pop the most recent PATH and restore it
    var lastPath = this._pathStack.pop();
    process.env.PATH = lastPath;
  });
};

exports.spawn = function (command, args, options) {
  before(function spawnFn(done) {
    // Run our command
    var that = this;
    bufferedSpawn(command, args, options, function handleBufferedSpawn(err, stdout, stderr) {
      // Save our results
      that.err = err;
      that.stdout = stdout;
      that.stderr = stderr;

      // Callback with no errors
      done();
    });
  });

  after(function cleanup() {
    // Clean up our results
    delete this.err;
    delete this.stdout;
    delete this.stderr;
  });
};
