var childUtils = require('./child-process');
var Foundry = require('../../');

exports.create = function (options) {
  // Fallback options
  options = options || {};

  // Create a new program
  var program = new Foundry();

  // If we are allowing setVersion, allow exec calls
  if (options.allowSetVersion) {
    program.once('setVersion#before', function () {
      childUtils.shellExec._allow();
      childUtils.childExec._allow();
    });
    program.once('setVersion#after', function () {
      childUtils.shellExec._ban();
      childUtils.childExec._ban();
    });
  }

  // If we are allowing register, allow exec calls
  if (options.allowRegister) {
    program.once('register#before', function () {
      childUtils.shellExec._allow();
      childUtils.childExec._allow();
    });
    program.once('register#after', function () {
      childUtils.shellExec._ban();
      childUtils.childExec._ban();
    });
  }

  // If we are allowing publish, allow exec calls
  if (options.allowPublish) {
    program.once('publish#before', function () {
      childUtils.shellExec._allow();
      childUtils.childExec._allow();
    });
    program.once('publish#after', function () {
      childUtils.shellExec._ban();
      childUtils.childExec._ban();
    });
  }

  // Return the program
  return program;
};