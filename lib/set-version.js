var async = require('async');
var npmRelease = require('./release/npm');
var bowerRelease = require('./release/bower');
var componentRelease = require('./release/component');
var pythonRelease = require('./release/python');
module.exports = function (version, cb) {
  var releases = [npmRelease, bowerRelease, componentRelease, pythonRelease];
  async.forEach(releases, function setVersionFn (release, cb) {
    release.setVersion(version, cb);
  }, cb);
};