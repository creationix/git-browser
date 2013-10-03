// Configure the platform
var platform = {
  bops: require('./lib/bops'),
  sha1: require('./lib/sha1.js'),
  inflate: require('./lib/inflate.js'),
  deflate: require('./lib/deflate.js'),
  tcp: require('./lib/web-tcp.js').tcp,
  tls: require('./lib/web-tcp.js').tls,
};
platform.http = require('./lib/pure-http.js')(platform);
if (/\btrace\b/.test(document.location.search)) {
  platform.trace = require('./lib/trace.js');
}

// Polyfill setImmediate
if (!window.setImmediate) window.setImmediate = require('./lib/defer.js');

// Configure the backend
var backend = require('./app/backend.js')({
  repo: require('js-git')(platform),
  remote: require('git-net')(platform),
  db: require('./lib/git-localdb.js')(platform),
  settings: window.localStorage
});

// Launch the GUI
require('./app/phone-ui.js')(backend);

