/*global FileError*/
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

var platform = {
  tcp: require('./chrome-tcp.js'),
  sha1: require('./sha1.js'),
  bops: require('./bops/index.js'),
  inflate: require('./inflate.js'),
  deflate: require('./deflate.js'),
  // trace: require('./trace.js'),
};

var jsGit = require('js-git')(platform);
var gitRemote = require('git-net')(platform);
var fsDb = require('git-fs-db')(platform);
var gitWebfs = require('./git-webfs.js');
var progressParser = require('./progress-parser.js');

var fs;
function getFs(callback) {
  if (fs) return callback(null, fs);
  var done = false;
  window.requestFileSystem(window.TEMPORARY, null, onInitFs, errorHandler);
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
