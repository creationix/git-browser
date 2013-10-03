var messages = {
  request: "\u21A0",
  response: "\u219E",
  input: "\u2190",
  output: "\u2192",
  save: "\u2907",
  load: "\u2906",
  remove: "\u2716",
  read: "\u2770",
  write: "\u2771",
};

module.exports = function (type, stream, item) {
  var message = messages[type] || type;
  if (!stream) {
    console.log(message, item);
    return;
  }
  if (!message) return stream;
  return { read: traceRead, abort: stream.abort };
  function traceRead(callback) {
    stream.read(function (err, item) {
      if (err) return callback(err);
      console.log(message, item);
      callback(null, item);
    });
  }
};
