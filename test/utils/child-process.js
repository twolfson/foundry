// Load in dependencies
var childProcess = require('child_process');
var sinon = require('sinon');

// Stop exec calls from happening
var shell = require('shelljs');
var originalExec = shell.exec;
shell.exec = shell.complaintExec = function () {
  throw new Error('`shell.exec` was being called with ' + JSON.stringify(arguments));
};

// Stop childProcess exec and spawn calls too unless people opt in to our methods
exports.iKnowWhatIAmDoingSpawn = childProcess.spawn;
childProcess.spawn = childProcess.complaintSpawn = function () {
  throw new Error('`childProcess.spawn` was being called with ' + JSON.stringify(arguments));
};
exports.iKnowWhatIAmDoingExec = childProcess.exec;
childProcess.exec = childProcess.complaintExec = function () {
  throw new Error('`childProcess.exec` was being called with ' + JSON.stringify(arguments));
};

exports.shellExec = {
  stub: function stubShellExec () {
    before(function () {
      this.execStub = sinon.stub(shell, 'exec', function () {
        return {};
      });
    });
    after(function () {
      this.execStub.restore();
    });
  },
  allow: function allowShellExec(fn, cb) {
    shell.exec = originalExec;
    fn(function (err) {
      shell.exec = shell.complaintExec;
      cb(err);
    });
  }
};

exports.childExec = {
  allow: function allowChildExec(fn, cb) {
    childProcess.exec = exports.iKnowWhatIAmDoingExec;
    fn(function (err) {
      childProcess.exec = childProcess.complaintExec;
      cb(err);
    });
  }
};
