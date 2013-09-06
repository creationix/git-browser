/*global FileError*/
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

require('js-git/lib/platform.js')({
  tcp: require('./chrome-tcp.js'),
  sha1: require('./sha1.js'),
  bops: require('./bops/index.js'),
  inflate: require('./inflate.js'),
  deflate: require('./deflate.js'),
  // trace: require('./trace.js'),
  trace: false,
  agent: "jsgit/" + require('js-git/package.json').version,
});

var fsDb = require('js-git/lib/fs-db.js');
var repoify = require('js-git/lib/repo.js');
var gitWebfs = require('./git-webfs.js');
var tcpProto = require('js-git/protocols/tcp.js');
var serial = require('js-git/helpers/serial.js');
var parallel = require('js-git/helpers/parallel.js');
var parallelData = require('js-git/helpers/parallel-data.js');
var serial = require('js-git/helpers/serial.js');
var parallel = require('js-git/helpers/parallel.js');
var parallelData = require('js-git/helpers/parallel-data.js');

var fs;
function getFs(callback) {
  if (fs) return callback(null, fs);
  var done = false;
  window.requestFileSystem(window.PERSISTENT, null, onInitFs, errorHandler);
  function onInitFs(webfs) {
    if (done) return;
    done = true;
    fs = gitWebfs(webfs.root);
    callback(null, fs);
  }
  function errorHandler(err) {
    var message = 'Unknown Error';
    for (var key in FileError) {
      if (!/_ERR$/.test(key)) continue;
      if (FileError[key] === err.code) {
        message = key;
        break;
      }
    }
    console.error('Error: ' + message);
    if (done) return;
    done = true;
    callback(new Error(message));
  }
}

function isGitDir(path) {
  return (/\.git$/).test(path);
}

var progMatch = /^([^:]*):[^\(]*\(([0-9]+)\/([0-9]+)\)/;
var progMatchBasic = /^([^:]*)/;
function parseProgress(string) {
  var match = string.match(progMatch) ||
              string.match(progMatchBasic);
  if (!match) return {};
  return {
    label: match[1],
    value: parseInt(match[2], 10),
    max: parseInt(match[3], 10)
  };
}

require('./main.js')({
  // opts are host, path, and description
  addRepo: function (opts, onProgress, callback) {
    getFs(function (err, fs) {
      if (err) return callback(err);
      var path = opts.hostname + opts.pathname;
      var description = opts.description || "git://" + path;
      path = path.replace(/\//g, "_");
      var repo = repoify(fsDb(fs(path), true));
      var config = {
        includeTag: true,
        onProgress: function (progress) {
          progress = parseProgress(progress);
          onProgress(progress.label, progress.value, progress.max);
        }
      };
      var connection = tcpProto(opts);
      parallelData({
        init: repo.init(),
        pack: connection.fetch(config),
      }, function (err, result) {
        if (err) return callback(err);
        serial(
          parallel(
            repo.importRefs(result.pack.refs),
            repo.unpack(result.pack, config)
          ),
          connection.close()
        )(function (err) {
          if (err) return callback(err);
          onProgress("Done");
          callback(null, repo);
        });
      });
    });
  },
  getRepos: function (callback) {
    getFs(function (err, fs) {
      if (err) return callback(err);
      fs.readdir("/", function (err, files) {
        if (err) return callback(err);
        callback(null, files.filter(isGitDir).map(function (path) {
          var repo = repoify(fsDb(fs(path), true));
          repo.name = path;
          repo.description = path;
          return repo;
        }));
      });
    });
  },
  getHistoryStream: function (repo, callback) {
    // queue of hashes/date pairs sorted by date
    var queue = [];
    // hashes we've already put in the queue
    var seen = {};
    var working = 0;
    var cb;
    var error;
    var done = false;
    repo.get("HEAD", function (err, hash) {
      if (err) return callback(err);
      enqueue(hash);
      callback(null, {read: read, abort: abort});
    });
    function enqueue(hash) {
      if (hash in seen) return;
      seen[hash] = true;
      working++;
      repo.loadCommit(hash, function (err, commit) {
        if (err) {
          error = err;
          return check();
        }
        commit.hash = hash;
        var match = commit.author.match(/([0-9]+) ([\-+]?[0-9]+)$/);
        var timestamp = match[1];
        if (!timestamp) {
          err = new Error("Invalid timestamp in " + commit.author);
          return check();
        }
        timestamp = parseInt(timestamp, 10);
        var index = queue.length;
        while (index > 0 && queue[index - 1][1] > timestamp) index--;
        queue.splice(index, 0, [commit, timestamp]);
        check();
      });
    }
    function check() {
      if (!--working && cb) {
        var callback = cb;
        cb = null;
        read(callback);
      }
    }
    function read(callback) {
      if (cb) throw new Error("Only onle read at a time");
      if (error) {
        var err = error;
        error = null;
        return callback(err);
      }
      if (done) return callback();
      if (working) {
        cb = callback;
        return;
      }
      var next = queue.pop();
      if (!next) return abort(callback);
      next = next[0];
      if (next.parents) {
        next.parents.forEach(enqueue);
      }
      callback(null, next);
    }
    function abort(callback) {
      done = true;
      queue = null;
      seen = null;
      callback();
    }
  },
  getCommit: function (repo, hash, callback) {
    repo.loadCommit(hash, function (err, commit) {
      if (err) return callback(err);
      commit.hash = hash;
      callback(null, commit);
    });
  },
  getTree: function (repo, hash, callback) {
    repo.loadTree(hash, function (err, tree) {
      if (err) return callback(err);
      tree.hash = hash;
      callback(null, tree);
    });
  }
});
