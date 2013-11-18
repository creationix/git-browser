// Configure the platform
var platform = {
  tcp: require('./moz-tcp.js').tcp,
  tls: require('./moz-tcp.js').tls,
  bops: require('bops'),
  sha1: require('git-sha1'),
  // inflate: require('git-zlib/inflate.js'),
  // deflate: require('git-zlib/deflate.js'),
  // trace: require('./trace.js'),
};
platform.http = require('git-http')(platform);

// Polyfill setImmediate
if (!window.setImmediate) window.setImmediate = require('./lib/defer.js');

// Configure the backend
var backend = require('./app/backend.js')({
  repo: require('js-git'),
  remote: require('git-net')(platform),
  db: require('git-indexeddb')(platform),
  // db: require('git-localdb')(platform),
  // db: require('git-memdb'),
  settings: { get: get, set: set },
});

function get(key) {
  return JSON.parse(window.localStorage.getItem(key));
}

function set(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

// Launch the GUI
require('./app/phone-ui.js')(backend);
