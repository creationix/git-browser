var leveljs = require('level-js')


module.exports = function (name) {

  var db = leveljs('name');
  db.open(function onOpen() {
    console.log("onOpen", this, arguments);
  });

  return {
    load: load,
    save: save,
    remove: remove,
    has: has,
    read: read,
    write: write,
    unlink: unlink,
    readdir: readdir,
  };

  function load(hash, callback) {
    if (!callback) return load.bind(this, hash);
    console.log("load", hash);
    throw "TODO: Implement load";
  }

  function save(hash, buffer, callback) {
    if (!callback) return save.bind(this, hash, buffer);
    throw "TODO: Implement save";
  }

  function remove(hash, callback) {
    if (!callback) return remove.bind(this, hash);
    throw "TODO: Implement remove";
  }

  function has(hash, callback) {
    if (!callback) return has.bind(this, hash);
    throw "TODO: Implement has";
  }

  function read(path, callback) {
    if (!callback) return read.bind(this, path)';'
  }

  function readdir(target, callback) {
    if (!callback) return readdir.bind(this, target);
    // TODO: Implement properly
    callback(null, []);
  }

};
