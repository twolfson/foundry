var shell = require('shelljs');
module.exports = function (version, cb) {
  // TODO: Don't miss out on testing .private for Python
  if (shell.test('-f', 'setup.py') && !shell.test('-f', '.pypi-private')) {
    shell.exec('python setup.py register');
  }

  // Callback
  cb();
};
