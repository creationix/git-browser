var chroot = module.exports = require('./indexdb-to-git-fs.js')();
var callback;
window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

var request = window.indexedDB.open("gitdb");
request.onsuccess = function(event) {
  chroot.setDb(request.result);
  callback(null, request.result);
};
request.onerror = function(event) {
  callback(new Error("Error: " + request.errorCode + ". Unable to get IndexedDB"));
};
chroot.init = init;

function init(cb) {
  if (!cb) return init.bind(this);
  callback = cb;
};
