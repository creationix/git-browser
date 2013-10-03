module.exports = function (git) {
  var metas = [];
  var dirty;
  var onAdd, onRemove;

  return {
    settings: git.settings,
    add: function (meta, callback) {
      for (var i = 0, l = metas.length; i < l; ++i) {
        if (metas[i].name === meta.name) {
          return callback(new Error(meta.name + " name already taken."));
        }
      }
      addRepo(meta, function (err, repo) {
        if (err) return callback(err);
        saveMeta();
        return callback(null, repo);
      });
    },
    remove: function (repo, callback) {
      var meta;
      for (var i = 0, l = metas.length; i < l; ++i) {
        meta = metas[i];
        if (meta.name === repo.name) break;
      }
      if (i >= l) {
        return callback(new Error("Unknown repo name " + repo.name));
      }
      metas.splice(i, 1);
      saveMeta();
      repo.clear(function (err) {
        if (err) return callback(err);
        onRemove(meta, i);
        return callback(null, meta);
      });
    },
    init: function (add, remove, callback) {
      onAdd = add;
      onRemove = remove;
      var json = git.settings.getItem("metas");
      var metas;
      if (!json) return setImmediate(callback);
      try {
        metas = JSON.parse(json);
      }
      catch (err) {
        return callback(err);
      }
      var left = metas.length;
      if (!metas.length) return setImmediate(callback);
      var done = false;
      metas.forEach(function (meta) {
        addRepo(meta, check);
      });
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
    }
  };

  function addRepo(meta, callback) {
    var db = git.db(meta.name);
    var repo = git.repo(db);
    repo.clear = db.clear;
    var index = metas.length;
    metas[index] = meta;
    repo.remote = git.remote(meta.url);
    repo.name = meta.name;
    repo.url = meta.url;
    repo.description = meta.description || meta.url;
    db.init(function (err) {
      if (err) return callback(err);
      onAdd(repo, index);
      return callback(null, repo);
    });
  }

  function saveMeta() {
    if (dirty) return;
    // Use dirty flag and setImmediate to coalesce many saves in a single tick.
    dirty = true;
    setImmediate(function () {
      dirty = false;
      var json;
      json = JSON.stringify(metas);
      git.settings.setItem("metas", json);
    });
  }

};
