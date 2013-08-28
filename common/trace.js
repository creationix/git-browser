if (true) {

  var log = require('domlog');
  var messages = {
    request: "\u21A0",
    response: "\u219E",
    input: "\u2190",
    output: "\u2192",
    exec: "exec",
    connect: "connect",
    save: "\u2907",
    load: "\u2906",
    remove: "\u2716",
    read: "\u2770",
    write: "\u2771",
  };

  module.exports = function (type, stream, item) {
    var message = messages[type];
    if (!stream) {
      return log(message || type, item);
    }
    if (!message) return stream;
    return { read: traceRead, abort: stream.abort };
    function traceRead(callback) {
      stream.read(function (err, item) {
        if (err) return callback(err);
        log(message, item);
        callback(null, item);
      });
    }
  }
}
else {
  module.exports = false;
}
