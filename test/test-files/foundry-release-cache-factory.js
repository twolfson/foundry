// DEV: Normally release libaries are modules, not classes.
// DEV: They don't have state.
function FoundryReleaseCacheFactory() {
  this.calls = [];
}
FoundryReleaseCacheFactory.prototype = {
  setVersion: function (params, cb) {
    this.calls.push('setVersion', [].slice.call(arguments));
    process.nextTick(cb);
  },
  commit: function (params, cb) {
    this.calls.push('commit', [].slice.call(arguments));
    process.nextTick(cb);
  },
  register: function (params, cb) {
    this.calls.push('register', [].slice.call(arguments));
    process.nextTick(cb);
  },
  publish: function (params, cb) {
    this.calls.push('publish', [].slice.call(arguments));
    process.nextTick(cb);
  }
};

module.exports = FoundryReleaseCacheFactory;
