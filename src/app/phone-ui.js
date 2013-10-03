var ui = require('./ui.js');

var backend;
module.exports = function (back) {
  backend = back;
  backend.init(onAdd, onRemove, onReady);
};

function onReady(err) {
  if (err) return ui.error(err);
  console.log("backend initialized", backend);
  backend.add({
    name: "creationix/conquest",
    url: "git://github.com/creationix/conquest.git",
    description: "A remake of the classic Lords of Conquest for C64 implemented in JavaScript"
  }, function (err, repo) {
    if (err) throw err;
    console.log("REPO", repo);
    backend.remove(repo, function (err, meta) {
      if (err) throw err;
      console.log("META", meta);
    });
  });
}

function onAdd(repo) {
  console.log("new Repo", repo);
}

function onRemove(index) {
  console.log("removed", index);
}
