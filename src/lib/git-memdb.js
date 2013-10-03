
function makeAsync(fn, callback) {
  if (!callback) return makeAsync.bind(this, fn);
  setImmediate(function () {
    var result;
    try { result = fn(); }
    catch (err) { return callback(err); }
    if (result === undefined) return callback();
    return callback(null, result);
  });
}

module.exports = function () {

  // Store everything in ram!
  var objects;
  var others;
  var isHash = /^[a-z0-9]{40}$/;

  return {
    get: get,
    set: set,
    has: has,
    del: del,
    keys: keys,
    init: init,
    clear: init,
  };

  function get(key, callback) {
    return makeAsync(function () {
      // hash (40 hex chars) keys get and set binary, others use strings.
      // This is an in-memory db so it doesn't care.
      if (isHash.test(key)) {
        return objects[key];
      }
      return others[key];
    }, callback);
  }

  function set(key, value, callback) {
    return makeAsync(function () {
      if (isHash.test(key)) {
        objects[key] = value;
      }
      else {
        others[key] = value.toString();
      }
    }, callback);
  }

  function has(key, callback) {
    return makeAsync(function () {
      if (isHash.test(key)) {
        return key in objects;
      }
      return key in others;
    }, callback);
  }

  function del(key, callback) {
    return makeAsync(function () {
      if (isHash.test(key)) {
        delete objects[key];
      }
      else {
        delete others[key];
      }
    }, callback);
  }

  function keys(prefix, callback) {
    return makeAsync(function () {
      var list = Object.keys(others);
      if (!prefix) return list;
      var length = prefix.length;
      return list.filter(function (key) {
        return key.substr(0, length) === prefix;
      }).map(function (key) {
        return key.substr(length);
      });
    }, callback);
  }

  function init(callback) {
    return makeAsync(function () {
      objects = {};
      others = {};
    }, callback);
  }

};
