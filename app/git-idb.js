window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var platform = require('js-git/lib/platform.js');
var trace = platform.require('trace');
var sha1 = platform.require('sha1');
var bops = platform.require('bops');

module.exports = function (name) {
  // TODO: remove cache and use real db
  var cache = {}; // Fake database for now

  var idb;
  return {
    name: name,
    write: write,
    read: read,
    save: save,
    load: load,
    remove: remove,
    init: init
  };

  function write(path, data, callback) {
    if (!callback) return write.bind(this, path, data);
    trace("TODO", null, {write:[path,data]});
    cache[path] = data;
    callback();
  }

  function read(path, callback) {
    if (!callback) return fs.read(path, "ascii");
    trace("TODO", null, {read:path});
    if (path in cache) return callback(null, cache[path]);
    callback(new Error("Cannot find " + path));
  }

  function save(object, callback) {
    if (!callback) return save.bind(this, object);
    var buffer = encode(object);
    var hash = sha1(buffer);
    trace("TODO", null, {write:[hash,object]});
    cache[hash] = object;
    callback(null, hash);
  }

  function load(hash, callback) {
    if (!callback) return load.bind(this, hash);
    trace("TODO", null, {load:hash})
    if (hash in cache) return callback(null, cache[hash]);
    callback(new Error("Cannot find " + hash));
  }

  function remove(hash, callback) {
    if (!callback) return remove.bind(this, hash);
    trace("TODO", null, {remove:hash})
    delete cache[hash];
    callback();
  }

  function init(callback) {
    if (!callback) return init.bind(this);
    if (idb) return callback(null, idb);
    var request = window.indexedDB.open("gitdb");
    request.onsuccess = function (evt) {
      idb = evt.target.result;
      callback(null, idb);
    };
    request.onerror = function (evt) {
      callback(new Error("Unable to get database: " + request.errorCode));
    };
  }
};

function encode(object) {
  return bops.join([
    bops.from(object.type + " " + object.body.length + "\0"),
    object.body
  ]);
}
