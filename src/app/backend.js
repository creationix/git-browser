module.exports = function (git) {
  var metas = [];
  var dirty;
  var onAdd, onRemove;
  var metaDb = git.db("__meta__");
  window.metaDb = metaDb;

  return {
    settings: metaDb,
    add: function (meta, callback) {
      for (var i = 0, l = metas.length; i < l; ++i) {
        if (metas[i].name === meta.name) {
          return callback(new Error(meta.name + " name already taken."));
        }
      }
      addRepo(meta, function (err, repo) {
        if (err) return callback(err);
        saveMeta(function (err) {
          return callback(err, repo);
        });
      });
    },
    remove: function (repo, callback) {
      var meta;
      for (var i = 0, l = metas.length; i < l; ++i) {
        meta = metas[i];
        if (meta.name !== repo.name) continue;
        onRemove(meta, i);
        return saveMeta(onSave);
      }
      function onSave(err) {
        return callback(err, meta);
      }
      return callback(new Error("Unknown repo name " + repo.name));
    },
    init: function (add, remove, callback) {
      onAdd = add;
      onRemove = remove;
      return metaDb.init(onInit);
      function onInit(err) {
        if (err) return callback(err);
        return metaDb.get("metas", onMetas);
      }

      function onMetas(err, json) {
        var metas;
        if (!json) return callback();
        try {
          metas = JSON.parse(json);
        }
        catch (err) {
          return callback(err);
        }
        var left = metas.length;
        if (!metas.length) return callback();
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
    }
  };

  function addRepo(meta, callback) {
    var db = git.db(meta.name);
    var repo = git.repo(db);
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

  function saveMeta(callback) {
    if (dirty) return;
    // Use dirty flag and setImmediate to coalesce many saves in a single tick.
    dirty = true;
    setImmediate(function () {
      dirty = false;
      var json;
      try {
        json = JSON.stringify(metas);
      }
      catch (err) {
        return callback(err);
      }
      return metaDb.set("metas", json, callback);
    });
  }

};
