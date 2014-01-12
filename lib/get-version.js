var fs = require('fs');
var shell = require('shelljs');
module.exports = function (version, cb) {
  var versions = [];

  // npm
  if (shell.test('-f', 'package.json')) {
    // TODO: Consider async stream mutate file onto itself
    var pkgJson = fs.readFileSync('package.json', 'utf8');
    var pkg = JSON.parse(pkgJson);
    versions.push({
      name: 'npm',
      version: pkg.version
    });
  }

  // bower
  if (shell.test('-f', 'bower.json')) {
    var bowerJson = fs.readFileSync('bower.json', 'utf8');
    var bower = JSON.parse(bowerJson);
    versions.push({
      name: 'bower',
      version: bower.version
    });
  }

  // component
  if (shell.test('-f', 'component.json')) {
    var componentJson = fs.readFileSync('component.json', 'utf8');
    var component = JSON.parse(componentJson);
    versions.push({
      name: 'component',
      version: component.version
    });
  }

  // Python
  if (shell.test('-f', 'setup.py')) {
    var pythonSetup = fs.readFileSync('setup.py', 'utf8');
    // http://pythonhosted.org/setuptools/setuptools.html#specifying-your-project-s-version
    // TODO: Need a better regexp for fetching it
    var pythonVersion = pythonSetup.match(/version='(\d+\.\d+\.\d+)'/);
    if (pythonVersion) {
      versions.push({
        name: 'python',
        version: pythonVersion[1]
      });
    }
  }

  // Callback
  cb();
};