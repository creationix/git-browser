require('js-git/lib/platform.js')({
  tcp: require('./tcp.js'),
  trace: require('../common/trace.js'),
  sha1: require('../common/sha1.js'),
  bops: require('../common/bops/index.js'),
  agent: "jsgit/" + require('js-git/package.json').version,
});
// require('../app/main-mem.js');
// require('./mozapp.js');
require('../app/main-ui.js');
