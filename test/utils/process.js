// Define our utilities
exports.changeCwd = function (dir) {
  before(function changeCwdFn () {
    // Save the current PATH for later
    this._cwdStack = this.cwdStack || [];
    this._cwdStack.push(process.cwd());

    // Move to our new cwd
    process.chdir(dir);
  });
  after(function restoreCwd () {
    // Pop the most recent cwd and restore it
    var lastCwd = this._cwdStack.pop();
    process.chdir(lastCwd);
  });
};
