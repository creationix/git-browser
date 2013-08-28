exports.connect = connect;
var trace = require('../common/trace.js');

function connect(port, host, callback) {
  if (typeof host === "function" && typeof callback === "undefined") {
    callback = host;
    host = "127.0.0.1";
  }
  if (!callback) return connect.bind(this, port, host);
  if (typeof port !== "number") throw new TypeError("port must be number");
  if (typeof host !== "string") throw new TypeError("host must be string");
  if (typeof callback !== "function") throw new TypeError("callback must be function");

  var socket = navigator.mozTCPSocket.open(host, port, {
    binaryType: "arraybuffer"
  });
  socket.onopen = function () {
    callback(null, wrapSocket(socket));
  }
}

function wrapSocket(socket) {
  var stream = socketToStream(socket);
  stream.sink = socketToSink(socket);
  return stream;
}

function socketToStream(socket) {
  log("wrap", socket)
  return { read: read, abort: abort };

  function read(callback) {
    log("READ")
    callback(new Error("TODO: Implement socket.read"));
  }

  function abort(callback) {
    log("ABORT")
    callback(new Error("TODO: Implement socket.abort"));
  }

}

function socketToSink(socket) {
  return sink;
  function sink(stream, callback) {
    if (!callback) return sink.bind(this, stream);
    log("TODO: Implement socket.sink");
  }
}
