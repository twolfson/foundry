// Export up to date plugin with echo upon publish
exports.specVersion = '1.1.0';

exports.publish = function (params, cb) {
  console.log('Hello World!');
  cb();
};
