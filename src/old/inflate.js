var Inflate = require('./zlib.js').Inflate;

module.exports = inflate;
function inflate(buffer, callback) {
  if (!callback) return inflate.bind(this, buffer);
  var inflater = new Inflate(buffer);
  var plain = inflater.decompress();
  callback(null, plain);
}
