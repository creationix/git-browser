require('js-git/lib/platform.js')({
  trace: require('../common/trace.js'),
});
require('js-git/lib/platform.js')({
  tcp: require('./tcp.js'),
  fs: require('./fs.js'),
  sha1: require('../common/sha1.js'),
  bops: require('../common/bops/index.js'),
  inflate: require('../common/inflate.js'),
  deflate: require('../common/deflate.js'),
  agent: "jsgit/0.2.5",
});
require('../app/main.js');
