var fs = require('fs');
var shell = require('shelljs');
var quote = require('shell-quote').quote;

exports.publish = function (params, cb) {
  // DEV: Since `git` *commits*, it always run after others to save them (e.g. bower, package.json)
  if (shell.test('-d', '.git')) {
    // Stringify message for passing as an argument
    // 'abc d$ef' -> '"abc d\$ef"'
    var msg = JSON.stringify(quote(message));

    // Commit outstanding changes, tag, and push
    shell.exec('git commit --allow-empty -a -m ' + msg);
    shell.exec('git tag ' + params.version);
    shell.exec('git push');
    shell.exec('git push --tags');
  }
  process.nextTick(cb);
};