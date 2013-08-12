require('js-git/lib/platform.js')({
  tcp: require('./tcp.js'),
  trace: require('./trace.js'),
  agent: "jsgit/0.2.3",
});
require('js-git/protocols/tcp.js');
