require('js-git/lib/platform.js')({
  trace: require('../common/trace.js'),
});
require('js-git/lib/platform.js')({
  tcp: require('./tcp.js'),
  sha1: require('../common/sha1.js'),
  bops: require('../common/bops/index.js'),
  agent: "jsgit/" + require('js-git/package.json').version,
});
require('../app/main-db.js');
