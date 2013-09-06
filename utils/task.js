var fs = require('fs');
var less = require('less');

var pathJoin = require('path').join;
var dirname = require('path').dirname;

module.exports = task;

var tasks = {};
var dependencies = {};
var started = {};
var done = {};
var slice = Array.prototype.slice;
task.mkdirp = wrap(mkdirp);
task.rmrf = wrap(rmrf);
task.run = wrap(run);
task.parallel = parallel;
task.serial = serial;
task.execute = execute;
task.copy = copy;
task.lessc = lessc;
task.build = build;

function task(name, deps, fn) {
  if (typeof deps === "function" && typeof fn === "undefined") {
    fn = deps;
    deps = null;
  }
  if (deps && deps.length) {
    dependencies[name] = deps;
  }
  tasks[name] = fn || call;
}

function wrap(fn) {
  return function () {
    var args = slice.call(arguments);
    if (args.length < 1) throw new TypeError("Missing arguments");
    var callback = args[args.length - 1];
    if (typeof callback === "function") { args.length--; }
    else { callback = null; }
    if (args.length === 1 && Array.isArray(args[0])) {
      args = args[0];
    }
    if (args.length === 1) {
      if (callback) return fn(args[0], callback);
      return fn.bind(this, args[0]);
    }
    if (callback) return execute(fn, args)(callback);
    return execute(fn, args);
  };
}

function execute(fn, args, callback) {
  if (callback) return execute(fn, args)(callback);
  return function (callback) {
    var length = args.length;
    if (!length) return callback();
    var left = length;
    var done = false;
    for (var i = 0; i < length; ++i) {
      fn(args[i], check);
    }
    function check(err) {
      if (done) return;
      if (err) {
        done = true;
        return callback(err);
      }
      if (!--left) {
        done = true;
        callback();
      }
    }
  };
}

function execute2(fn, args, args2, callback) {
  if (callback) return execute2(fn, args, args2)(callback);
  return function (callback) {
    var length = args.length;
    if (!length) return callback();
    var left = length;
    var done = false;
    for (var i = 0; i < length; ++i) {
      fn(args[i], args2[i], check);
    }
    function check(err) {
      if (done) return;
      if (err) {
        done = true;
        return callback(err);
      }
      if (!--left) {
        done = true;
        callback();
      }
    }
  };
}


function parallel() {
  var actions = slice.call(arguments);
  return function (callback) {
    var length = actions.length;
    if (!length) return callback();
    var left = length;
    var done = false;
    for (var i = 0; i < length; ++i) {
      actions[i](check);
    }
    function check(err) {
      if (done) return;
      if (err) {
        done = true;
        return callback(err);
      }
      if (!--left) {
        done = true;
        return callback();
      }
    }
  };
}

function serial() {
  var actions = arguments;
  return function (callback) {
    var i = 0;
    var length = actions.length;
    next();
    function next(err) {
      if (err) return callback(err);
      if (i >= length) return callback();
      actions[i++](next);
    }
  };
}

function parallelData(actions, next) {
  var length = actions.length;
  if (!length) return next;
  return function (callback) {
    var data = new Array(length);
    var left = length;
    var done = false;
    actions.forEach(function (action, i) {
      action(function (err, result) {
        if (done) return;
        if (err) {
          done = true;
          return callback(err);
        }
        data[i] = result;
        if (!--left) {
          done = true;
          return next.apply(null, data)(callback);
        }
      });
    });
  };
}

function run(name, callback) {
  if (name in done) return callback();
  if (name in started) {
    return started.push(callback);
  }
  if (!(name in tasks)) {
    return callback("Unknown task " + name);
  }
  // console.log("Starting " + name);
  var waiters = started[name] = [callback];
  var task;
  if (name in dependencies) {
    task = serial(
      execute(run, dependencies[name]),
      tasks[name]
    );
  }
  else {
    task = tasks[name];
  }
  task(function (err) {
    if (err) return callback(err);
    done[name] = true;
    // console.log("Finished " + name);
    delete started[name];
    waiters.forEach(call);
  });
}

function call(fn) { fn(); }

function mkdirp(path, callback) {
  if (!callback) return mkdirp.bind(this, path);
  make();
  function make(err) {
    if (err) return callback(err);
    fs.mkdir(path, onmkdir);
  }
  function onmkdir(err) {
    if (err) {
      if (err.code === "ENOENT") return mkdirp(dirname(path), make);
      if (err.code === "EEXIST") return callback();
      return callback(err);
    }
    console.log("mkdir " + path);
    callback();
  }
}

function rmrf(path, callback) {
  if (!callback) return rmrf.bind(this, path);
  fs.unlink(path, onunlink);
  function onunlink(err) {
    if (err) {
      if (err.code === "ENOENT") return callback();
      if (err.code === "EISDIR") return fs.rmdir(path, onrmdir);
      return callback(err);
    }
    console.log("unlink " + path);
    callback();
  }
  function onrmdir(err) {
    if (err) {
      if (err.code === "ENOTEMPTY") return fs.readdir(path, onreaddir);
      return callback(err);
    }
    console.log("rmdir " + path);
    callback();
  }
  function onreaddir(err, names) {
    if (err) return callback(err);
    execute(rmrf, names.map(join))(onemptydir);
  }
  function onemptydir(err) {
    if (err) return callback(err);
    fs.rmdir(path, onrmdir);
  }
  function join(name) {
    return pathJoin(path, name);
  }
}

function copy(source, dest, callback) {
  if (!callback) return copy.bind(this, source, dest);
  fs.readdir(source, onreaddir);
  function onreaddir(err, names) {
    if (err) {
      if (err.code === "ENOTDIR") return copyFile(source, dest, callback);
      return callback(err);
    }
    copyDir(source, dest, names, callback);
  }
}

function stat(path) {
  return function (callback) {
    fs.stat(path, function (err, stat) {
      if (err && err.code === "ENOENT") return callback();
      callback(err, stat);
    });
  };
}

function copyFile(source, dest, callback) {
  if (callback) return copyFile(source, dest)(callback);
  return parallelData([
    stat(source),
    stat(dest),
    mkdirp(dirname(dest))
  ], function (s, d) {
    return function (callback) {
      if (d && d.mtime > s.mtime) return callback();
      fs.readFile(source, function (err, data) {
        if (err) return callback(err);
        fs.writeFile(dest, data, function (err) {
          if (err) return callback(err);
          console.log("cp %s %s", source, dest);
          callback();
        });
      });
    };
  });
}

function copyDir(source, dest, names, callback) {
  mkdirp(dest, function (err) {
    if (err) return callback(err);
    execute2(copy, names.map(sourceJoin), names.map(destJoin), callback);
  });
  function sourceJoin(name) {
    return pathJoin(source, name);
  }
  function destJoin(name) {
    return pathJoin(dest, name);
  }
}

function newer(sourceDir, pattern, dest, callback) {
  fs.stat(dest, function (err, stat) {
    var mtime;
    if (err) {
      if (err.code === "ENOENT") return callback(null, true);
      return callback(err);
    }
    mtime = stat.mtime;
    var left;
    var done = false;
    fs.readdir(sourceDir, function (err, names) {
      if (err) return callback(err);
      names = names.filter(function (name) {
        return pattern.test(name);
      });
      var length = names.length;
      if (!length) return callback();
      left = length;
      for (var i = 0; i < length; ++i) {
        fs.stat(pathJoin(sourceDir, names[i]), check);
      }
    });
    function check(err, stat) {
      if (done) return;
      if (err) {
        done = true;
        return callback(err);
      }
      if (stat.mtime > mtime) {
        done = true;
        return callback(null, true);
      }
      if (!--left) {
        done = true;
        return callback();
      }
    }
  });
}

function lessc(source, dest, callback) {
  if (!callback) return lessc.bind(this, source, dest);
  newer(dirname(source), /\.less$/, dest, function (err, go) {
    if (err) return callback(err);
    if (!go) return callback();
    parallelData([
      fs.readFile.bind(fs, source, "utf8"),
      mkdirp(dirname(dest))
    ], function (code) {
      return function (callback) {
        var parser = new(less.Parser)({
            paths: [dirname(source)],
            filename: source
        });
        parser.parse(code, function (err, tree) {
          if (err) return callback(err);
          fs.writeFile(dest, tree.toCSS(), function (err) {
            if (err) return callback(err);
            console.log("lessc %s > %s", source, dest);
            callback();
          });
        });
      };
    })(callback);
  });
}

function build(source, dest, callback) {
  if (!callback) return build.bind(this, source, dest);
  newer(dirname(source), /\.js$/, dest, function (err, go) {
    if (err) return callback(err);
    if (!go) return callback();
    require('./find-deps.js').build(source, function (err, code) {
      if (err) return callback(err);
      mkdirp(dirname(dest), function (err) {
        if (err) return callback(err);
        fs.writeFile(dest, code, function (err) {
          if (err) return callback(err);
          console.log("./find-deps.js %s > %s", source, dest);
        });
      });
    });
  });
}