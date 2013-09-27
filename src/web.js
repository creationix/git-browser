var repos = {};

var platform = {
  bops: require('./bops'),
  sha1: require('./sha1.js'),
  tcp: require('./web-tcp.js')
};

var memDb = require('./git-memdb.js');
var jsGit = require('js-git')(platform);

require('./main.js')({
  remote: require('git-net')(platform),
  listRepos: function (callback) {
    callback(null, Object.keys(repos).map(function (name) {
      return repos[name];
    }));
  },
  createRepo: function (meta, callback) {
    var name = meta.name;
    if (name in repos) {
      return callback(new Error(name + " already exists.  Choose a new name"));
    }
    var repo = repos[name] = jsGit(memDb());
    for (var key in meta) {
      repo[key] = meta[key];
    }
    callback(null, repo);
  },
  removeRepo: function (name, callback) {
    delete repos[name];
    callback();
  }
});
