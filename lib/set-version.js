var fs = require('fs');
var shell = require('shelljs');
module.exports = function (version, cb) {
  // npm
  if (shell.test('-f', 'package.json')) {
    // TODO: Consider async stream mutate file onto itself
    var pkgJson = fs.readFileSync('package.json', 'utf8');
    var pkg = JSON.parse(pkgJson);
    pkg.version = version;
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2), 'utf8');
  }

  // bower
  if (shell.test('-f', 'bower.json')) {
    var bowerJson = fs.readFileSync('bower.json', 'utf8');
    var bower = JSON.parse(bowerJson);
    bower.version = version;
    fs.writeFileSync('bower.json', JSON.stringify(bower, null, 2), 'utf8');
  }

  // component
  if (shell.test('-f', 'component.json')) {
    var componentJson = fs.readFileSync('component.json', 'utf8');
    var component = JSON.parse(componentJson);
    component.version = version;
    fs.writeFileSync('component.json', JSON.stringify(component, null, 2), 'utf8');
  }

  // Python
  if (shell.test('-f', 'setup.py')) {
    var pythonSetup = fs.readFileSync('setup.py', 'utf8');
    // http://pythonhosted.org/setuptools/setuptools.html#specifying-your-project-s-version
    pythonSetup = pythonSetup.replace(/version='\d+\.\d+\.\d+'/, 'version=\'' + version + '\'');
    fs.writeFileSync('setup.py', pythonSetup, 'utf8');
  }

  // Callback
  cb();
};