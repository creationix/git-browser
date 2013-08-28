var chroot = module.exports = require('./web-to-git-fs.js')();
var callback;
window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
window.requestFileSystem(PERSISTENT, 0, function (webfs) {
  chroot.setRoot(webfs.root);
  callback(null, webfs);
}, function (err) {
  callback(new Error("Unable to get filesystem"));
});
chroot.init = init;

function init(cb) {
  if (!cb) return init.bind(this);
  callback = cb;
};
