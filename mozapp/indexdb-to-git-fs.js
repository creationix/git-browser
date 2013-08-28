var platform = require('js-git/lib/platform.js');
var trace = platform.require('trace');

module.exports = function (db) {
  chroot.setDb = function (value) { db = value; };
  chroot.read = read;
  chroot.read = read;
  chroot.write = write;
  chroot.unlink = unlink;
  chroot.readlink = readlink;
  chroot.symlink = symlink;
  chroot.readdir = readdir;
  chroot.rmdir = rmdir;
  chroot.mkdir = mkdir;
  chroot.rename = rename;
  chroot.mkdir = mkdir;
  return chroot;

  function chroot(root) {
    var exports = wrap(chroot);
    exports.root = root;
    exports.stat = wrap(stat);
    exports.read = wrap(read);
    exports.write = wrap(write);
    exports.unlink = wrap(unlink);
    exports.readlink = wrap(readlink);
    exports.symlink = wrap(symlink);
    exports.readdir = wrap(readdir);
    exports.rmdir = wrap(rmdir);
    exports.mkdir = wrap(mkdir);
    exports.rename = wrap(rename, true);
    return exports;

    function wrap(fn, two) {
      return function () {
        arguments[0] = pathJoin(root, pathJoin("/", arguments[0]));
        if (two) arguments[1] = pathJoin(root, pathJoin("/", arguments[1]));
        return fn.apply(this, arguments);
      };
    }
  }

  // Given a path, return a continuable for the stat object.
  function stat(path, callback) {
    if (!callback) return stat.bind(this, path);
    trace("TODO", null, "stat");
  }

  function read(path, encoding, callback) {
    if (typeof encoding === "function") {
      callback = encoding;
      encoding = undefined;
    }
    if (!callback) return read.bind(this, path, encoding);
    trace("TODO", null, "read");
  }

  function write(path, value, mode, callback) {
    if (!callback) return write.bind(this, path, value, mode);
    trace("TODO", null, "write");
  }

  function unlink(path, callback) {
    if (!callback) return unlink.bind(this, path);
    trace("TODO", null, "unlink");
  }

  function readlink(path, callback) {
    if (!callback) return readlink.bind(this, path);
    trace("TODO", null, "readlink");
  }

  function symlink(path, value, callback) {
    if (!callback) return symlink.bind(this, path, value);
    trace("TODO", null, "symlink");
  }

  function readdir(path, callback) {
    if (!callback) return readdir.bind(this, path);
    trace("TODO", null, "readdir");
  }

  function rmdir(path, callback) {
    if (!callback) return rmdir.bind(this, path);
    trace("TODO", null, "rmdir");
  }

  function mkdir(path, callback) {
    if (!callback) return mkdir.bind(this, path);
    trace("TODO", null, "mkdir");
  }

  function rename(source, target, callback) {
    if (!callback) return rename.bind(this, source, target);
    trace("TODO", null, "rename");
  }

}

function dirname(path) {
  if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
  var index = path.lastIndexOf("/");
  if (index === 0) return "/";
  if (index > 0) return path.substr(0, index);
  return ".";
}

function pathJoin(base, path) {
  if (base[base.length - 1] === "/") base = base.substr(0, base.length - 1);
  if (path[0] === "/") path = path.substr(1);
  return base + "/" + path;
}
