
require('js-git/lib/platform.js')({
  tcp: require('./moz-tcp.js'),
  sha1: require('./sha1.js'),
  bops: require('./bops/index.js'),
  // trace: require('./trace.js'),
  trace: false,
  agent: "jsgit/" + require('js-git/package.json').version,
});

var gitMemdb = require('./git-memdb.js');
var repoify = require('js-git/lib/repo.js');
var tcpProto = require('js-git/protocols/tcp.js');
var serial = require('js-git/helpers/serial.js');
var parallel = require('js-git/helpers/parallel.js');
var parallelData = require('js-git/helpers/parallel-data.js');
var serial = require('js-git/helpers/serial.js');
var parallel = require('js-git/helpers/parallel.js');
var parallelData = require('js-git/helpers/parallel-data.js');

var progMatch = /^([^:]*):[^\(]*\(([0-9]+)\/([0-9]+)\)/;
var progMatchBasic = /^([^:]*)/;
function progressParser(emit) {
  var buffer = "";
  return function (chunk) {
    var start = 0;
    for (var i = 0, l = chunk.length; i < l; ++i) {
      var c = chunk[i];
      if (c === "\r" || c === "\n") {
        buffer += chunk.substr(start, i);
        start = i + 1;
        var match = buffer.match(progMatch) ||
                    buffer.match(progMatchBasic);
        buffer = "";
        if (!match) continue;
        emit(match[1], parseInt(match[2], 10), parseInt(match[3], 10));
      }
    }
    buffer += chunk.substr(start);
  };
}

var repos = [];

require('./main.js')({
  // opts are host, path, and description
  addRepo: function (opts, onProgress, callback) {
    var path = opts.hostname + opts.pathname;
    var description = opts.description || "git://" + path;
    path = path.replace(/\//g, "_");
    var repo = repoify(gitMemdb(), true);
    var name = opts.pathname;
    if (name[0] === "/") name = name.substr(1);
    if (name.substr(name.length - 4) === ".git") name = name.substr(0, name.length - 4);
    repo.name = name;
    repo.description = description;
    repos.push(repo);
    var config = {
      includeTag: true,
      onProgress: progressParser(onProgress)
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
  },
  getRepos: function (callback) {
    callback(null, repos);
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
    repo.get("refs/heads/master", function (err, hash) {
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
