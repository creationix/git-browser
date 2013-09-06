var domBuilder = require('dombuilder');
var log = require('domlog');
window.log = log;
document.body.innerText = "";
log.setup({
  top: "0",
  height: "auto",
  background: "#222"
});
log("In-Memory Test");

// Load the libraries
var repoify = require('js-git/lib/repo.js');
var tcpProto = require('js-git/protocols/tcp.js');
var serial = require('js-git/helpers/serial.js');
var parallel = require('js-git/helpers/parallel.js');
var gitMemdb = require('./git-memdb.js');

var opts = {
  protocol: "git:",
  hostname: "github.com",
  pathname: "/creationix/conquest.git"
};

var config = {
  includeTag: true,
  onProgress: log,
  onError: log
};

var repo = repoify(gitMemdb(), true);
var connection = tcpProto(opts);
connection.fetch(config, wrap(function (err, pack) {
  log("onfetch", err, pack);
  if (err) throw err;
  serial(
    parallel(
      repo.importRefs(pack.refs),
      repo.unpack(pack, config)
    ),
    connection.close()
  )(wrap(function (err) {
    if (err) log("FAIL", err);
    else log("DONE");
  }));
}));


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
