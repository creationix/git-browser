// Simple helper to map over an object and return an array
exports.map = map;
function map(obj, callback) {
  var keys = Object.keys(obj);
  var result = [];
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    result.push(callback(key, obj[key]));
  }
  return result;
}

exports.each = each;
function each(obj, callback) {
  var keys = Object.keys(obj);
  for (var i = 0, l = keys.length; i < l; i++) {
    var key = keys[i];
    callback(key, obj[key]);
  }
}
