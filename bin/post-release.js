var shell = require('shelljs');
module.exports = function (version, cb) {
  // npm
  if (shell.test('-f', 'package.json')) {
    // If the package.json does not contain a 'private: true', publish it
    var result = shell.exec('node -e "f = \'./package.json\'; p = require(f); process.exit(+(p.private||0))"');
    if (result.code === 0) {
      // TODO: Don't let this live as sync. Use spawn with forwarding to stdio.
      shell.exec('npm publish');
    }
  }

  // TODO: Don't miss out on testing .private for Python
  if (shell.test('-f', 'setup.py') && !shell.test('-f', '.private')) {
    // If the package is at 0.1.0, register it
    // TODO: This should be comparing to default
    if (version === '0.1.0') {
      shell.exec('python setup.py register');
    }

    // Build and upload the package
    shell.exec('python setup.py sdist --formats=gztar,zip upload');
  }

  // Callback
  cb();
};