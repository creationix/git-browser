require('js-git/lib/platform.js')({
  tcp: require('./tcp.js'),
  trace: require('../common/trace.js'),
  agent: "jsgit/0.2.3",
});
require('../app/main.js');
