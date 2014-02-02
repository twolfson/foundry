var fs = require('fs');
var shell = require('shelljs');

exports.setVersion = function (params, cb) {
  if (shell.test('-f', 'setup.py')) {
    var pythonSetup = fs.readFileSync('setup.py', 'utf8');
    var output = pythonSetup.replace(/version='\d+\.\d+\.\d+'/, 'version=\'' + params.version + '\'');
    fs.writeFile('setup.py', output, 'utf8', cb);
  } else {
    process.nextTick(cb);
  }
};

exports.register = function (params, cb) {
  // TODO: Don't miss out on testing .private for Python
  if (shell.test('-f', 'setup.py') && !shell.test('-f', '.pypi-private')) {
    shell.exec('python setup.py register');
  }

  // Callback
  process.nextTick(cb);
};

exports.publish = function (params, cb) {
  // TODO: Don't miss out on testing .private for Python
  if (shell.test('-f', 'setup.py') && !shell.test('-f', '.pypi-private')) {
    // Build and upload the package
    shell.exec('python setup.py sdist --formats=gztar,zip upload');
  }

  // Callback
  process.nextTick(cb);
};