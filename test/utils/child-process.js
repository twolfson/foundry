// Load in dependencies
var childProcess = require('child_process');

// Define our utilities
exports.addToPath = function (dir) {
  before(function addToPathFn () {
    // Save the current PATH for later
    this._pathStack = this.pathStack || [];
    this._pathStack.push(process.env.PATH);

    // Prepend the new directory to the PATH so it's hit first
    process.env.PATH = dir + ':' + process.env.PATH;
  });
  after(function restorePath () {
    // Pop the most recent PATH and restore it
    var lastPath = this._pathStack.pop();
    process.env.PATH = lastPath;
  });
};

exports.exec = function (cmd, options) {
  before(function execFn (done) {
    var that = this;
    childProcess.exec(cmd, options, function handleExec (err, stdout, stderr) {
      // Save result and callback
      that.err = err;
      that.stdout = stdout;
      that.stderr = stderr;
      done();
    });
  });
  after(function cleanupExec () {
    delete this.err;
    delete this.stdout;
    delete this.stderr;
  });
};
