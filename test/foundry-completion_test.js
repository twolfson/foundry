// Load in dependencies
var expect = require('chai').expect;
var Foundry = require('../');

function runCompletion() {
  before(function (done) {
    // Create a new program and run auto-complete on it
    var program = new Foundry();
    var that = this;
    program.completion(this.params, function (err, data) {
      that.data = data;
      done(err);
    });
  });
}

describe('A partial `release` command', function () {
  before(function () {
    // TODO: It would be nice to make the split functionality into a node module
    // TODO: We have done some work on this inside of sublime-plugin-tests
    // foundry rel|e
    this.params = {
      wordIndex: 1,
      words: ['foundry', 'rele'],
      line: 'foundry rele',
      linePosition: 11
    };
  });

  describe('when completed', function () {
    runCompletion();

    it('receives `release` as an auto-complete option', function () {
      expect(this.data).to.contain('release');
    });
  });
});

describe('A partial `release` command with semver', function () {
  before(function () {
    // foundry rele|0.1.0
    this.params = {
      wordIndex: 1,
      words: ['foundry', 'rele0.1.0'],
      line: 'foundry rele0.1.0',
      linePosition: 12
    };
  });

  describe('when completed', function () {
    runCompletion();

    it('receives `release` as an auto-complete option', function () {
      expect(this.data).to.contain('release');
    });
  });
});

describe('An empty command', function () {
  before(function () {
    // foundry |
    this.params = {
      wordIndex: 1,
      words: ['foundry', ''],
      line: 'foundry ',
      linePosition: 8
    };
  });

  describe('when completed', function () {
    runCompletion();

    it('receives no options', function () {
      expect(this.data).to.have.property('length', 0);
    });
  });
});

describe.skip('A partial `release` command including semver but in the meat of the command', function () {
  before(function () {
    // foundry r|el0.1.0
    this.params = {
      wordIndex: 1,
      words: ['foundry', 'rel0.1.0'],
      line: 'foundry rel0.1.0',
      linePosition: 9
    };
  });

  describe('when completed', function () {
    runCompletion();

    it('receives receives release with some deletion marks', function () {
      expect(this.data).to.contain('release');
    });
  });
});
