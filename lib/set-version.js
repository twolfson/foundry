var async = require('async');
var npmRelease = require('./release/npm');
var bowerRelease = require('./release/bower');
module.exports = function (version, cb) {
  async.forEach([npmRelease, bowerRelease], function setVersionFn (release, cb) {
    release.setVersion(version, cb);
  }, cb);
  // // component
  // if (shell.test('-f', 'component.json')) {
  //   var componentJson = fs.readFileSync('component.json', 'utf8');
  //   var component = JSON.parse(componentJson);
  //   component.version = version;
  //   fs.writeFileSync('component.json', JSON.stringify(component, null, 2), 'utf8');
  // }

  // // Python
  // if (shell.test('-f', 'setup.py')) {
  //   var pythonSetup = fs.readFileSync('setup.py', 'utf8');
  //   pythonSetup = pythonSetup.replace(/version='\d+\.\d+\.\d+'/, 'version=\'' + version + '\'');
  //   fs.writeFileSync('setup.py', pythonSetup, 'utf8');
  // }

  // // Callback
  // cb();
};