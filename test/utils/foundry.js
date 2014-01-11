var childUtils = require('./child-process');
var Foundry = require('../../');

exports.create = function (options) {
  // Fallback options
  options = options || {};

  // Create a new program
  var program = new Foundry();

  // If we are allowing preRelease, allow exec calls
  if (options.allowPreRelease) {
    program.once('preRelease#before', function () {
      childUtils.shellExec._allow();
      childUtils.childExec._allow();
    });
    program.once('preRelease#after', function () {
      childUtils.shellExec._ban();
      childUtils.childExec._ban();
    });
  }

  // If we are allowing gitTag, allow exec calls
  if (options.allowGitTag) {
    program.once('gitTag#before', function () {
      childUtils.shellExec._allow();
      childUtils.childExec._allow();
    });
    program.once('gitTag#after', function () {
      childUtils.shellExec._ban();
      childUtils.childExec._ban();
    });
  }

  // If we are allowing postRelease, allow exec calls
  if (options.allowPostRelease) {
    program.once('postRelease#before', function () {
      childUtils.shellExec._allow();
      childUtils.childExec._allow();
    });
    program.once('postRelease#after', function () {
      childUtils.shellExec._ban();
      childUtils.childExec._ban();
    });
  }

  // Return the program
  return program;
};