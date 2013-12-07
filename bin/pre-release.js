var shell = require('shelljs');
module.exports = function (version, cb) {
  // npm
  if (shell.test('-f', 'package.json')) {
    // TODO: Use shellquote
    // TODO: Avoid exec altogether
    shell.exec('node -e "f = \'./package.json\'; p = require(f); p.version = \'' + version + '\'; require(\'fs\').writeFileSync(f, JSON.stringify(p, null, 2));"');

    // If there is a build script, run it
    // TODO: This should be an opt-in action (not everyone will share this opinion)
    var result = shell.exec('node -e "f = \'./package.json\'; p = require(f); process.exit(+(!(p.scripts || {}).build))"');
    if (result.code === 0) {
      shell.exec('npm run build');
    }
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

  // Callback
  cb();
};