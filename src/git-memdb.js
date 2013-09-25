
var defer = (function() {
  var timeouts = [];
  var messageName = "zero-timeout-message";

  function handleMessage(event) {
    if (event.source == window && event.data == messageName) {
      event.stopPropagation();
      if (timeouts.length > 0) {
        var fn = timeouts.shift();
        fn();
      }
    }
  }

  window.addEventListener("message", handleMessage, true);

  return function (fn) {
    timeouts.push(fn);
    window.postMessage(messageName, "*");
  };

})();

module.exports = function () {

  // Store everything in ram!
  var db = {};

  return {
    db: db,
    load: load,
    save: save,
    remove: remove,
    has: has,
    read: load,
    write: save,
    unlink: remove,
    readdir: readdir,
  };

  function load(hash, callback) {
    if (!callback) return load.bind(this, hash);
    if (hash in db) return defer(function () {
      callback(null, db[hash]);
    });
    callback(new Error("Cannot find " + hash));
  }

  function save(hash, buffer, callback) {
    if (!callback) return save.bind(this, hash, buffer);
    db[hash] = buffer;
    defer(callback);
  }


  function has(hash, callback) {
    defer(function () {
      callback(null, hash in db);
    });
  }

  function remove(hash, callback) {
    if (!callback) return remove.bind(this, hash);
    delete db[hash];
    defer(callback);
  }

  function readdir(target, callback) {
    var items = Object.keys(db).filter(function (key) {
      return key.substr(0, target.length) === target;
    }).map(function (key) {
      return key.substr(target.length);
    });
    defer(function () {
      callback(null, items);
    });
  }
};
