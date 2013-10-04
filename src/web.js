// Configure the platform
var platform = {
  bops: require('./lib/bops'),
  sha1: require('git-sha1'),
  // inflate: require('git-zlib/inflate.js'),
  // deflate: require('git-zlib/deflate.js'),
  tcp: require('websocket-tcp-client').tcp,
  tls: require('websocket-tcp-client').tls,
};
platform.http = require('git-http')(platform);
if (/\btrace\b/.test(document.location.search)) {
  platform.trace = require('./lib/trace.js');
}

// Polyfill setImmediate
if (!window.setImmediate) window.setImmediate = require('./lib/defer.js');

// Configure the backend
var backend = require('./app/backend.js')({
  repo: require('js-git')(platform),
  remote: require('git-net')(platform),
  db: require('git-localdb')(platform),
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

