var fs = require('fs');
var shell = require('shelljs');

exports.publish = function (params, cb) {
  // DEV: Since `git` *commits*, it always run after others to save them (e.g. bower, package.json)
  if (shell.test('-d', '.git')) {
    var version = params.version;
    shell.exec('git commit -a -m "Release ' + version + '"');
    shell.exec('git tag ' + version);
    shell.exec('git push');
    shell.exec('git push --tags');
  }
  process.nextTick(cb);
};