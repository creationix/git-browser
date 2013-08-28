
module.exports = function (fs) {
  var root = fs.root;

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
    var errorHandler = wrapCallback(callback);
    root.getFile(path, {create: false}, function (fileEntry) {
      fileEntry.getMetadata(function (metaData) {
        var mtime = metaData.modificationTime / 1000;
        var mseconds = Math.floor(mtime);
        var mtime = [mseconds, Math.floor((mtime - mseconds) * 1000000000)];
        callback(null, {
          ctime: mtime,  // Not available on this platform
          mtime: mtime,
          dev: 0,        // Not available on this platform
          ino: 0,        // Not available on this platform
          mode: 0100644, // Not supported on this platform
          uid: 0,        // Not available on this platform
          gid: 0,        // Not available on this platform
          size: metaData.size
        });
      }, errorHandler);
    }, errorHandler);
  }

  function read(path, encoding, callback) {
    if (typeof encoding === "function") {
      callback = encoding;
      encoding = undefined;
    }
    if (!callback) return read.bind(this, path, encoding);
    var errorHandler = wrapCallback(callback);
    root.getFile(path, {}, function (fileEntry) {
      fileEntry.file(function(file) {
        var reader = new FileReader();
        reader.onloadend = function (evt) {
          var value = this.result;
          if (!encoding) {
            value = new Uint8Array(value);
          }
          callback(null, value);
        };
        if (!encoding) {
          return reader.readAsArrayBuffer(file);
        }
        if (encoding === "binary") {
          return reader.readAsBinaryString(file);
        }
        return reader.readAsText(file, encoding);
      }, errorHandler);
    }, errorHandler);
  }

  function write(path, value, mode, callback) {
    if (!callback) return write.bind(this, path, value, mode);
    var errorHandler = wrapCallback(callback);
    root.getFile(path, {create: true}, function (fileEntry) {
      fileEntry.createWriter(function(fileWriter) {
        fileWriter.onwriteend = function (evt) {
          callback();
        };
        fileWriter.onerror = function (evt) {
          callback(new Error("Write failed: " + evt.toString()));
        };
        fileWriter.write(new Blob([value]));
      }, errorHandler);
    }, errorHandler);
  }

  function unlink(path, callback) {
    if (!callback) return unlink.bind(this, path);
    var errorHandler = wrapCallback(callback);
    root.getFile(path, {create: false}, function (fileEntry) {
      fileEntry.remove(function () {
        callback();
      }, errorHandler);
    }, errorHandler);
  }

  function readlink(path, callback) {
    if (!callback) return readlink.bind(this, path);
    callback(new Error("Symlinks are not supported in webfs"));
  }

  function symlink(path, value, callback) {
    if (!callback) return symlink.bind(this, path, value);
    callback(new Error("Symlinks are not supported in webfs"));
  }

  function readdir(path, callback) {
    if (!callback) return readdir.bind(this, path);
    var errorHandler = wrapCallback(callback);
    root.getDirectory(path, {create: false}, function (dirEntry) {
      var dirReader = dirEntry.createReader();
      var entries = [];
      dirReader.readEntries(onRead, errorHandler);
      function onRead(results) {
        if (results.length) {
          entries = entries.concat(toArray(results));
          dirReader.readEntries(onRead, errorHandler);
        }
        callback(null, entries);
      }
    }, errorHandler);
  }

  function rmdir(path, callback) {
    if (!callback) return rmdir.bind(this, path);
    var errorHandler = wrapCallback(callback);
    root.getDirectory(path, {create: false}, function (dirEntry) {
      dirEntry.remove(function () {
        callback();
      }, function (e) {
        var err = new Error(formatError(e));
        if (e.code === FileError.INVALID_MODIFICATION_ERR) {
          err.code = "ENOTEMPTY";
        }
        callback(err);
      });
    }, errorHandler);
  }

  function mkdir(path, callback) {
    if (!callback) return mkdir.bind(this, path);
    if (path === "." || path === "/") return callback();
    var errorHandler = wrapCallback(callback);
    root.getDirectory(path, {create: true}, function (dirEntry) {
      callback();
    }, errorHandler);
  }

  function rename(source, target, callback) {
    if (!callback) return rename.bind(this, source, target);
    var errorHandler = wrapCallback(callback);
    root.getFile(source, {}, function (fileEntry) {
      var dirName = dirname(target);
      root.getDirectory(dirName, {}, function (dirEntry) {
        fileEntry.moveTo(dirEntry);
      }, errorHandler);
    }, errorHandler);
  }


};

function toArray(list) {
  return Array.prototype.slice.call(list || [], 0);
}

function wrapCallback(callback) {
  return function (err) {
    callback(formatError(err));
  };
}

function formatError(e) {
  var message;
  var code;
  switch (e.code) {
    case FileError.QUOTA_EXCEEDED_ERR:
      message = 'QUOTA_EXCEEDED_ERR';
      code = "EQUOTA";
      break;
    case FileError.NOT_FOUND_ERR:
      message = 'NOT_FOUND_ERR';
      code = "ENOENT";
      break;
    case FileError.SECURITY_ERR:
      message = 'SECURITY_ERR';
      code = "ESECURITY";
      break;
    case FileError.INVALID_MODIFICATION_ERR:
      message = 'INVALID_MODIFICATION_ERR';
      code = "EINVLDMOD";
      break;
    case FileError.INVALID_STATE_ERR:
      message = 'INVALID_STATE_ERR';
      code = "EINVLDSTATE";
      break;
    default:
      message = "Unknown Error";
      code = "EUNKNOWN";
      break;
  };
  var err = new Error(message);
  err.code = code;
  return err;
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
