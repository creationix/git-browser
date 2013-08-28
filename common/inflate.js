var Inflate = require('./zlib.js').Inflate;

module.exports = inflate;
function inflate(buffer, callback) {
  if (!callback) return inflate.bind(this, buffer);
  var inflate = new Inflate(buffer);
  var plain = inflate.decompress();
  callback(null, plain);
}
