/*global chrome*/

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

var local = chrome.storage.local;
var deflate, inflate;
module.exports = function (platform) {
  deflate = platform.deflate || fake;
  inflate = platform.inflate || fake;
  return localDb;
};
function fake(input, callback) {
  // setImmediate(function () {
    callback(null, input);
  // });
}

function localDb(prefix) {

  prefix;

  var refs;
  var isHash = /^[a-z0-9]{40}$/;

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
      return local.get(key, function (items) {
        if (chrome.runtime.lastError) {
          return callback(new Error(chrome.runtime.lastError.message));
        }
        var deflated = fromString(items[key]);
        return inflate(deflated, callback);
      });
    }
    setImmediate(function () {
      callback(null, refs[key]);
    });
  }

  function set(key, value, callback) {
    if (!callback) return set.bind(this, key, value);
    if (isHash.test(key)) {
      return deflate(value, function (err, deflated) {
        var q = {};
        q[key] = toString(deflated);
        local.set(q, onSet);
      });
    }
    refs[key] = value.toString();
    var q = {};
    q[prefix] = refs;
    local.set(q, onSet);

    function onSet() {
      if (chrome.runtime.lastError) {
        return callback(new Error(chrome.runtime.lastError.message));
      }
      return callback();
    }
  }

  function has(key, callback) {
    if (isHash.test(key)) {
      return local.get(key, function (items) {
        callback(null, (key) in items);
      });
    }
    return callback(null, key in refs);
  }

  function del(key, callback) {
    if (isHash.test(key)) {
      return local.remove(key, onRemove);
    }
    delete refs[key];
    var q = {};
    q[prefix] = refs;
    local.set(q, onRemove);

    function onRemove() {
      if (chrome.runtime.lastError) {
        return callback(new Error(chrome.runtime.lastError.message));
      }
      return callback();
    }
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
    if (!callback) return init.bind(this);
    local.get(prefix, function (items) {
      refs = items[prefix] || {};
      callback();
    });
  }

  function clear(callback) {
    if (!callback) return clear.bind(this);
    refs = {};
    local.remove(prefix, callback);
  }
}


// Here we're storing the data as base 16 since even binary strings seem to fail.
function toString(buffer) {
  var string = "";
  for (var i = 0, l = buffer.length; i < l; ++i) {
    var x = buffer[i];
    if (x < 0x10) string += "0" + x.toString(16);
    else string += x.toString(16);
  }
  return string;
}

function fromString(string) {
  var length = string.length;
  var buffer = new Uint8Array(length >> 1);
  for (var i = 0; i < length; i += 2) {
    buffer[i >> 1] = parseInt(string.substr(i, 2), 16);
  }
  return buffer;
}

// function toString(buffer) {
//   var string = "";
//   for (var i = 0, l = buffer.length; i < l; ++i) {
//     string += String.fromCharCode(buffer[i]);
//   }
//   return string;
// }

// function fromString(string) {
//   var length = string.length;
//   var buffer = new Uint8Array(length);
//   for (var i = 0; i < length; ++i) {
//     buffer[i] = string.charCodeAt(i);
//   }
//   return buffer;
// }
