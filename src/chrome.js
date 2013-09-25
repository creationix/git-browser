/*global FileError*/
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

var platform = {
  tcp: require('./chrome-tcp.js'),
  sha1: require('./sha1.js'),
  bops: require('./bops/index.js'),
  inflate: require('./inflate.js'),
  deflate: require('./deflate.js'),
  // trace: require('./trace.js'),
  trace: false,
  agent: "jsgit/" + require('js-git/package.json').version,
};

var jsGit = require('js-git')(platform);
var gitRemote = require('git-net')(platform);
var fsDb = require('git-fs-db')(platform);
var gitWebfs = require('./git-webfs.js');


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

require('./main.js')({
  // opts are host, path, and description
  addRepo: function (opts, onProgress, callback) {
    getFs(function (err, fs) {
      if (err) return callback(err);
      var url = "git://" + opts.hostname + opts.pathname;
      var description = opts.description || url;
      var path = (opts.hostname + opts.pathname).replace(/\//g, "_");
      var repo = jsGit(fsDb(fs(path)));
      var remote = gitRemote(url);
      var name = opts.pathname;
      if (name[0] === "/") name = name.substr(1);
      if (name.substr(name.length - 4) === ".git") name = name.substr(0, name.length - 4);
      repo.name = name;
      repo.description = description;

      repo.fetch(remote, {
        includeTag: true,
        onProgress: progressParser(onProgress)
      }, function (err) {
        if (err) return callback(err);
        onProgress("Done");
        callback(null, repo);
      });
    });
  },
  getRepos: function (callback) {
    getFs(function (err, fs) {
      if (err) return callback(err);
      fs.readdir("/", function (err, files) {
        if (err) return callback(err);
        callback(null, files.filter(isGitDir).map(function (path) {
          var repo = jsGit(fsDb(fs(path)));
          repo.name = path;
          repo.description = path;
          return repo;
        }));
      });
    });
  },
  getHistoryStream: function (repo, callback) {
    repo.logWalk("HEAD", callback);
  },
  getCommit: function (repo, hash, callback) {
    repo.loadAs("commit", hash, function (err, commit) {
      if (err) return callback(err);
      commit.hash = hash;
      callback(null, commit);
    });
  },
  getTree: function (repo, hash, callback) {
    repo.loadAs("tree", hash, function (err, tree) {
      if (err) return callback(err);
      tree.hash = hash;
      callback(null, tree);
    });
  }
});
