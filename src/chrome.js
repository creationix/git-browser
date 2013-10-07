/*global chrome*/

// Configure the platform
var platform = {
  tcp: require('./lib/chrome-tcp.js'),
  sha1: require('git-sha1'),
  bops: require('./lib/bops/index.js'),
  // inflate: require('git-zlib/inflate.js'),
  // deflate: require('git-zlib/deflate.js'),
  // trace: require('./trace.js'),
};
platform.http = require('git-http')(platform);

// Polyfill setImmediate
if (!window.setImmediate) window.setImmediate = require('./lib/defer.js');

// Configure the backend
var backend = require('./app/backend.js')({
  repo: require('js-git')(platform),
  remote: require('git-net')(platform),
  db: require('./lib/git-chrome-localdb.js')(platform),
  // db: require('./lib/git-memdb.js'),
  settings: { get: get, set: set },
});

var sync = chrome.storage.sync;
var settings;

function get(key) {
  return settings[key];
}
function set(key, value) {
  settings[key] = value;
  var dump = {};
  dump[key] = value;
  sync.set(dump);
}

var ui = require('./app/ui.js');
ui.confirm = function (message, callback) {
  console.log("Confirm", message);
  callback(true);
};
ui.error = function (err) {
  console.error(err.stack);
};

sync.get(null, function (items) {
  settings = items;
  require('./app/phone-ui.js')(backend);
});

