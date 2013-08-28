var Deflate = require('./zlib.js').Deflate;
var stringToByteArray = require('./zlib.js').Util.stringToByteArray;

module.exports = deflate;
function deflate(buffer, callback) {
  if (!callback) return deflate.bind(this, buffer);
  if (typeof buffer === "string") {
    buffer = stringToByteArray(buffer);
    }
  var deflater = new Deflate(buffer);
  var compressed = deflater.compress();
  callback(null, compressed);
}
