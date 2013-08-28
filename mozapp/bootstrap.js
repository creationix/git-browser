require('js-git/lib/platform.js')({
  tcp: require('./tcp.js'),
  sha1: require('../common/sha1.js'),
  trace: require('../common/trace.js'),
  agent: "jsgit/0.2.4",
});
require('../app/main.js');
