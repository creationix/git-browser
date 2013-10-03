
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

var deflate, inflate;
module.exports = function (platform) {
  deflate = platform.deflate || fake;
  inflate = platform.inflate || fake;
  return localDb;
};

function fake(input, callback) {
  setImmediate(function () {
    callback(null, input);
  });
}

function localDb(prefix) {

  var refs;
  var isHash = /^[a-z0-9]{40}$/;

  prefix += "/";

  return {
    get: get,
    set: set,
    has: has,
    del: del,
    keys: keys,
    init: init,
    clear: clear
  };

  function get(key, callback) {
    if (!callback) return get.bind(this, key);
    if (isHash.test(key)) {
      var raw = localStorage.getItem(prefix + key);
      if (!raw) return;
      var length = raw.length;
      var buffer = new Uint8Array(length);
      for (var i = 0; i < length; ++i) {
        buffer[i] = raw.charCodeAt(i);
      }
      return inflate(buffer, callback);
    }
    setImmediate(function () {
      callback(null, refs[key]);
    });
  }

  function set(key, value, callback) {
    if (!callback) return set.bind(this, key, value);
    if (isHash.test(key)) {
      return deflate(value, function (err, deflated) {
        var raw = "";
        for (var i = 0, l = deflated.length; i < l; ++i) {
          raw += String.fromCharCode(deflated[i]);
        }
        try {
          localStorage.setItem(prefix + key, raw);
        }
        catch (err) {
          return callback(err);
        }
        callback();
      });
    }
    refs[key] = value.toString();
    localStorage.setItem(prefix, JSON.stringify(refs));
    setImmediate(callback);
  }

  function has(key, callback) {
    return makeAsync(function () {
      if (isHash.test(key)) {
        return !!localStorage.getItem(prefix + key);
      }
      return key in refs;
    }, callback);
  }

  function del(key, callback) {
    return makeAsync(function () {
      if (isHash.test(key)) {
        localStorage.removeItem(prefix + key);
      }
      else {
        delete refs[key];
      }
    }, callback);
  }

  function keys(prefix, callback) {
    return makeAsync(function () {
      var list = Object.keys(refs);
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
      var json = localStorage.getItem(prefix);
      if (!json) {
        refs = {};
        return;
      }
      refs = JSON.parse(json);
    }, callback);
  }

  function clear(callback) {
    return makeAsync(function () {
      var length = prefix.length;
      for (var i = localStorage.length - 1; i >= 0; --i) {
        var key = localStorage.key(i);
        if (key.substr(0, length) !== prefix) continue;
        localStorage.removeItem(key);
      }
      refs = {};
      localStorage.removeItem(prefix);
    }, callback);
  }
}
