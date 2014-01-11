var shell = require('shelljs');
module.exports = function (version, cb) {
  // npm
  if (shell.test('-f', 'package.json')) {
    // TODO: Use shellquote
    // TODO: Avoid exec altogether
    shell.exec('node -e "f = \'./package.json\'; p = require(f); p.version = \'' + version + '\'; require(\'fs\').writeFileSync(f, JSON.stringify(p, null, 2));"');
  }

  // bower
  if (shell.test('-f', 'bower.json')) {
    shell.exec('node -e "f = \'./bower.json\'; p = require(f); p.version = \'' + version + '\'; require(\'fs\').writeFileSync(f, JSON.stringify(p, null, 2));"');
  }

  // component
  if (shell.test('-f', 'component.json')) {
    shell.exec('node -e "f = \'./component.json\'; p = require(f); p.version = \'' + version + '\'; require(\'fs\').writeFileSync(f, JSON.stringify(p, null, 2));"');
  }

  // Python
  if (shell.test('-f', 'setup.py')) {
    shell.exec('node -e "fs = require(\'fs\'); f = \'./setup.py\'; p = fs.readFileSync(f, \'utf8\'); v = \'' + version + '\'; p = p.replace(/version=\'\\d+.\\d+.\\d+\'/, \'version=\\\'\' + v + \'\\\'\'); fs.writeFileSync(f, p, \'utf8\');"');
  }

  // git
  // DEV: Since `git` commits, it should always run after all others such that their commits are saved
  // TODO: Should we test this? It would imply that *all* bower files are inside of git repos
  if (shell.test('-d', '.git')) {
    shell.exec('git commit -a -m "Release ' + version + '"');
    shell.exec('git tag ' + version + ' -a -m "Release ' + version + '"');
  }

  // Callback
  cb();
};