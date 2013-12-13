// Load in dependencies
var expect = require('chai').expect;
var Foundry = require('../');

describe.only('A partial `release` command', function () {
  // TODO: It would be nice to make the split functionality into a node module
  before(function () {
    // foundry rel|e
    this.params = {
      wordIndex: 1,
      line: 'foundry rele',
      linePosition: 11
    };
  });

  describe('when completed', function () {

    it('receives `release` as an auto-complete option', function () {

    });
  });
});