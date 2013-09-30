var repoMeta;
var repos = {};

var platform = {
  bops: require('./bops'),
  sha1: require('./sha1.js'),
  tcp: require('./web-tcp.js').tcp,
  tls: require('./web-tcp.js').tls,
};
platform.http = require('./pure-http.js')(platform);

// var newDb = require('./git-localdb.js');
var newDb = require('./git-memdb.js');
var jsGit = require('js-git')(platform);

loadMeta();

require('./main.js')({
  remote: require('git-net')(platform),
  listRepos: listRepos,
  createRepo: createRepo,
  removeRepo: removeRepo
});

function getRepo(name) {
  var meta = repoMeta[name];
  var repo = repos[name];
  if (!repo) {
    repo = repos[name] = jsGit(newDb(name));
  }
  repo.name = name;
  repo.url = meta.url;
  repo.description = meta.description;
  return repo;
}

function loadMeta() {
  var saved = localStorage.getItem("_meta");
  if (saved) {
    repoMeta = JSON.parse(saved);
  }
  else {
    repoMeta = {};
  }
}

function saveMeta() {
  localStorage.setItem("_meta", JSON.stringify(repoMeta));
}

function listRepos(callback) {
  callback(null, Object.keys(repoMeta).map(getRepo));
}

function createRepo(meta, callback) {
  var name = meta.name;
  if (name in repoMeta) {
    return callback(new Error(name + " already exists.  Choose a new name"));
  }
  repoMeta[name] = {
    url: meta.url,
    description: meta.description
  };
  repos[name] = jsGit(newDb(name));
  saveMeta();
  callback();
}

function removeRepo(name, callback) {
  delete repos[name];
  delete repoMeta[name];
  saveMeta();
  callback();
}
