// Load in dependencies
var childProcess = require('child_process');

// Define our utilities
exports.exec = function (cmd, options) {
  before(function execFn (done) {
    var that = this;
    childProcess._exec(cmd, options, function handleExec (err, stdout, stderr) {
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
