// Check if a new cache is available on page load.
window.addEventListener('load', function(e) {
  window.applicationCache.addEventListener('updateready', function(e) {
    if (window.applicationCache.status == window.applicationCache.UPDATEREADY) {
      // Browser downloaded a new app cache.
      // if (confirm('A new version of this site is available. Load it?')) {
        window.location.reload();
      // }
    } else {
      // Manifest didn't changed. Nothing new to server.
    }
  }, false);
}, false);

// Configure the platform
var platform = {
  bops: require('bops'),
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
  repo: require('js-git'),
  remote: require('git-net')(platform),
  db: require('git-indexeddb')(platform),
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

