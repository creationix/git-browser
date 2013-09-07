
var platform = require('js-git/lib/platform.js');
var sha1 = platform.require('sha1');
var bops = platform.require('bops');

module.exports = function () {

  // Store everything in ram!
  var db = {};

  return {
    db: db,
    write: write,
    read: read,
    save: save,
    load: load,
    remove: remove,
    init: init,
  };

  function write(path, data, callback) {
    if (!callback) return write.bind(this, path, data);
    db[path] = data;
    callback();
  }

  function read(path, callback) {
    if (!callback) return read.bind(this, path);
    if (path in db) return callback(null, db[path]);
    callback(new Error("Cannot find " + path));
  }

  function save(object, callback) {
    if (!callback) return save.bind(this, object);
    var buffer = bops.join([
      bops.from(object.type + " " + object.body.length + "\0"),
      object.body
    ]);
    var hash = sha1(buffer);
    db[hash] = object;
    setTimeout(callback, 10, null, hash);
    // callback(null, hash);
  }

  function load(hash, callback) {
    if (!callback) return load.bind(this, hash);
    if (hash in db) return callback(null, db[hash]);
    callback(new Error("Cannot find " + hash));
  }

  function remove(hash, callback) {
    if (!callback) return remove.bind(this, hash);
    delete db[hash];
    callback();
  }

  function init(callback) {
    if (!callback) return init.bind(this);
    callback();
  }
};
