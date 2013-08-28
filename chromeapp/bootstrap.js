require('js-git/lib/platform.js')({
  tcp: require('./tcp.js'),
  sha1: require('../common/sha1.js'),
  inflate: require('../common/inflate.js'),
  deflate: require('../common/deflate.js'),
  trace: require('../common/trace.js'),
  agent: "jsgit/0.2.5",
});
require('../app/main.js');
