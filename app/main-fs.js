var domBuilder = require('dombuilder');
var log = require('domlog');
window.log = log;
document.body.innerText = "";
log.setup({
  top: "0",
  height: "auto",
  background: "#222"
});
log("FileSystem Test");

// Load the libraries
var fsDb = require('js-git/lib/fs-db.js');
var repoify = require('js-git/lib/repo.js');
var tcpProto = require('js-git/protocols/tcp.js');
var serial = require('js-git/helpers/serial.js');
var parallel = require('js-git/helpers/parallel.js');
var parallelData = require('js-git/helpers/parallel-data.js');
var gitWebfs = require('./git-webfs.js');
var platform = require('js-git/lib/platform.js');

var opts = {
  protocol: "git:",
  hostname: "github.com",
  pathname: "/creationix/conquest.git"
};

window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystem(PERSISTENT, 0, onFs, function (err) {
  throw new Error("Unable to get filesystem: " + err);
});

var config = {
  includeTag: true,
  onProgress: log,
  onError: log
};

function onFs(webfs) {
  var repo = repoify(fsDb(gitWebfs(webfs.root), true));
  var connection = tcpProto(opts);
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
    )(function (err) {
      if (err) throw err;
      log("DONE");
    });
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
