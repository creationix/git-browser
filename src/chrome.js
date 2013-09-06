/*global FileError*/
window.requestFileSystem  = window.requestFileSystem || window.webkitRequestFileSystem;

require('js-git/lib/platform.js')({
  tcp: require('./chrome-tcp.js'),
  sha1: require('./sha1.js'),
  bops: require('./bops/index.js'),
  inflate: require('./inflate.js'),
  deflate: require('./deflate.js'),
  trace: require('./trace.js'),
  agent: "jsgit/" + require('js-git/package.json').version,
});

var fsDb = require('js-git/lib/fs-db.js');
var repoify = require('js-git/lib/repo.js');
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

require('./main.js')({
  addRepo: function (host, path, onProgress, callback) {
    console.log("TODO: Implement addRepo");
  },
  getRepos: function (callback) {
    getFs(function (err, fs) {
      if (err) return callback(err);
      fs.readdir("/", function (err, files) {
        if (err) return callback(err);
        callback(null, files.filter(isGitDir).map(function (path) {
          return {
            name: path,
            description: path,
            repo: repoify(fsDb(fs(path)), true)
          };
        }));
      });
    });
  },
  getHistoryStream: function (repo, callback) {
    console.log("TODO: Implement getRepos");
  },
  getCommit: function (repo, hash, callback) {
    console.log("TODO: Implement getRepos");
  },
  getTree: function (repo, hash, callback) {
    console.log("TODO: Implement getRepos");
  }
});
