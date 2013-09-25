
var platform ={
  tcp: require('./moz-tcp.js'),
  sha1: require('./sha1.js'),
  bops: require('./bops/index.js'),
  // trace: require('./trace.js'),
};

var jsGit = require('js-git')(platform);
var gitRemote = require('git-net')(platform);
var gitMemdb = require('./git-memdb.js');
var progressParser = require('./progress-parser.js');

var repos = [];

require('./main.js')({
  // opts are host, path, and description
  addRepo: function (opts, onProgress, callback) {
    var url = "git://" + opts.hostname + opts.pathname;
    var description = opts.description || url;
    var repo = jsGit(gitMemdb());
    var remote = gitRemote(url);
    var name = opts.pathname;
    if (name[0] === "/") name = name.substr(1);
    if (name.substr(name.length - 4) === ".git") name = name.substr(0, name.length - 4);
    repo.name = name;
    repo.description = description;
    repos.push(repo);

    repo.fetch(remote, {
      includeTag: true,
      onProgress: progressParser(onProgress)
    }, function (err) {
      if (err) return callback(err);
      onProgress("Done");
      callback(null, repo);
    });

  },
  getRepos: function (callback) {
    callback(null, repos);
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
