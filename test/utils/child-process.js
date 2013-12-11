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

function allowExec(fn, cb) {
  var that = this;
  this._allow();
  fn(function (err) {
    that._ban();
    cb(err);
  });
}
exports.shellExec = {
  // DEV: To avoid any missed `.call`, make the context (`this`) a require param
  _stub: function (context) {
    context.execStub = sinon.stub(shell, 'exec', function () {
      return {};
    });
  },
  _unstub: function (context) {
    context.execStub.restore();
  },
  stub: function stubShellExec () {
    var that = this;
    before(function () {
      that._stub(this);
    });
    after(function () {
      that._unstub(this);
    });
  },
  _allow: function () {
    shell.exec = originalExec;
  },
  _ban: function () {
    shell.exec = shell.complaintExec;
  },
  allow: allowExec
};

exports.childExec = {
  _allow: function () {
    childProcess.exec = exports.iKnowWhatIAmDoingExec;
  },
  _ban: function () {
    childProcess.exec = childProcess.complaintExec;
  },
  allow: allowExec
};
