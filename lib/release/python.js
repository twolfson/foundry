var fs = require('fs');
var shell = require('shelljs');

exports.setVersion = function (version, cb) {
  if (shell.test('-f', 'setup.py')) {
    var pythonSetup = fs.readFileSync('setup.py', 'utf8');
    var output = pythonSetup.replace(/version='\d+\.\d+\.\d+'/, 'version=\'' + version + '\'');
    fs.writeFile('setup.py', output, 'utf8', cb);
  } else {
    process.nextTick(cb);
  }
};

exports.register = function (version, cb) {
  // TODO: Don't miss out on testing .private for Python
  if (shell.test('-f', 'setup.py') && !shell.test('-f', '.pypi-private')) {
    shell.exec('python setup.py register');
  }

  // Callback
  cb();
};