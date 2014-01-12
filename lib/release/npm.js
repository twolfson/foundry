var fs = require('fs');
var shell = require('shelljs');

exports.setVersion = function (version, cb) {
  if (shell.test('-f', 'package.json')) {
    // TODO: Consider async stream mutate file onto itself
    var pkgJson = fs.readFileSync('package.json', 'utf8');
    var pkg = JSON.parse(pkgJson);
    pkg.version = version;
    var output = JSON.stringify(pkg, null, 2);
    fs.writeFile('package.json', output, 'utf8', cb);
  } else {
    process.nextTick(cb);
  }
};