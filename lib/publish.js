var shell = require('shelljs');
module.exports = function (cb) {
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
    var result = shell.exec('node -e "f = \'./package.json\'; p = require(f); process.exit(+(p.private||0))"');
    if (result.code === 0) {
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