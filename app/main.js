var domBuilder = require('dombuilder');
var log = require('domlog');
window.log = log;
document.body.innerText = "";
log.setup({
  top: "0",
  height: "auto",
  background: "#222"
});

// Load the libraries
var fsDb = require('js-git/lib/fs-db.js');
var repoify = require('js-git/lib/repo.js');
var autoProto = require('js-git/protocols/auto.js');
var serial = require('js-git/helpers/serial.js');
var parallel = require('js-git/helpers/parallel.js');
var parallelData = require('js-git/helpers/parallel-data.js');
var webToGitFs = require('../chromeapp/web-to-git-fs.js');

var opts = {
  protocol: "git:",
  hostname: "github.com",
  pathname: "/creationix/conquest.git"
};

var connection = autoProto(opts);
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystem(PERSISTENT, 0, onFs, function (err) {
  throw new Error("Unable to get filesystem");
});
var config = {
  includeTag: true,
  onProgress: log,
  onError: log
};

function onFs(webfs) {
  var fs = webToGitFs(webfs);
  var db = fsDb(fs, true);
  var repo = repoify(db);
  var connection = autoProto(opts);

  // Export for easy debugging
  window.fs = fs;
  window.db = db;
  window.repo = repo;
  window.connection = connection;

  connection.discover(wrap(function (err, refs) {
    if (err) throw err;
    Object.keys(refs).forEach(function (ref) {
      log(refs[ref] + "\t" + ref);
    });
    connection.close(wrap(function (err) {
      if (err) throw err;
      log("DONE");
    }));
  }));

  parallelData({
    init: repo.init(),
    pack: connection.fetch(config),
  }, wrap(function (err, result) {
    if (err) throw err;
    serial(
      parallel(
        repo.importRefs(result.pack.refs),
        repo.unpack(result.pack, config)
      ),
      connection.close()
    )(wrap(function (err) {
      if (err) throw err;
      console.log("DONE");
    }));
  }));

}

// Wrap a function in one that redirects exceptions.
// Use for all event-source handlers.
function wrap(fn) {

  return function () {
    try {
      return fn.apply(this, arguments);
    }
    catch (err) {
      log(err);
    }
  };
}
