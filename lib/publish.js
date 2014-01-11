var fs = require('fs');
var shell = require('shelljs');
module.exports = function (version, cb) {
  // git
  // DEV: Since `git` *commits*, it always run after others to save them (e.g. bower, package.json)
  if (shell.test('-d', '.git')) {
    shell.exec('git commit -a -m "Release ' + version + '"');
    shell.exec('git tag ' + version + ' -a -m "Release ' + version + '"');
    shell.exec('git push');
    shell.exec('git push --tags');
  }

  // npm
  if (shell.test('-f', 'package.json')) {
    // If the package.json does not contain a 'private: true', publish it
    var pkgJson = fs.readFileSync('package.json', 'utf8');
    var pkg = JSON.parse(pkgJson);
    if (!pkg['private']) {
      // TODO: Don't let this live as sync. Use spawn with forwarding to stdio.
      shell.exec('npm publish');
    }
  }

  // TODO: Don't miss out on testing .private for Python
  if (shell.test('-f', 'setup.py') && !shell.test('-f', '.pypi-private')) {
    // Build and upload the package
    shell.exec('python setup.py sdist --formats=gztar,zip upload');
  }

  // Callback
  cb();
};