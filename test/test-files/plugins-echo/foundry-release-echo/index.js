// Export up to date plugin with echo upon publish
exports.specVersion = '1.1.0';

exports.updateFiles = function (params, cb) {
  console.log('updateFiles occurred');
  cb();
};

exports.commit = function (params, cb) {
  console.log('commit occurred');
  cb();
};

exports.register = function (params, cb) {
  console.log('register occurred');
  cb();
};

exports.publish = function (params, cb) {
  console.log('Publish occurred');
  cb();
};
