// Load in dependencies
var expect = require('chai').expect;
var Foundry = require('../');

describe.only('A partial `release` command', function () {
  before(function () {
    // TODO: It would be nice to make the split functionality into a node module
    // TODO: We have done some work on this inside of sublime-plugin-tests
    // foundry rel|e
    this.params = {
      wordIndex: 1,
      line: 'foundry rele',
      linePosition: 11
    };
  });

  describe('when completed', function () {
    before(function (done) {
      // Create a new program and run auto-complete on it
      var program = new Foundry();
      var that = this;
      program.completion(this.params, function (err, data) {
        that.data = data;
        done(err);
      });
    });

    it('receives `release` as an auto-complete option', function () {
      expect(this.data).to.contain('release');
    });
  });
});