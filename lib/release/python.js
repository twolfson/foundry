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