var foundry = require('../');

// Stop exec calls from happening
var shell = require('shelljs');
shell.exec = function () {};

// DEV: NEVER EVER RUN FOUNDRY VIA .exec
// DEV: WE CANNOT STOP .exec CALLS FROM OCCURRING IN ANOTHER PROCESS
// TODO: Strongly consider running tests within a Vagrant to prevent publication since nothing is configured

describe('foundry', function () {
  before(function () {

  });

  it('', function () {

  });
});
