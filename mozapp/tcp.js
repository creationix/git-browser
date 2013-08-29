var TCPSocket = navigator.TCPSocket || navigator.mozTCPSocket;

exports.connect = connect;

function connect(port, host, callback) {
  if (typeof host === "function" && typeof callback === "undefined") {
    callback = host;
    host = "127.0.0.1";
  }
  if (!callback) return connect.bind(this, port, host);
  if (typeof port !== "number") throw new TypeError("port must be number");
  if (typeof host !== "string") throw new TypeError("host must be string");
  if (typeof callback !== "function") throw new TypeError("callback must be function");
  log("connect", port, host, callback)

  var socket = TCPSocket.open(host, port, { binaryType: "arraybuffer" });

  socket.onopen = function () {
    log("onopen", {
      host: socket.host,
      port: socket.port,
      ssl: socket.ssl,
      bufferedAmount: socket.bufferedAmount,
      binaryType: socket.binaryType,
      readyState: socket.readyState
    });
    socket.onopen = null;
    callback(null, wrapSocket(socket));
  };
  socket.ondata = function (evt) {
    log("ondata", evt);
  };
  socket.onerror = function (err) {
    callback(new Error("Connection Error: " + err.type));
  };
}

function wrapSocket(socket) {
  log("wrapSocket", socket)
  var done = false;
  var cb = null;
  var queue = [];
  var reading = false;
  var source = null;
  var finish;

  socket.ondata = function (evt) {
    var chunk = new Uint8Array(evt.data);
    log("ondata", chunk);
    queue.push([null, chunk]);
    return check();
  };

  socket.onclose = function () {
    log("onclose");
    queue.push([]);
    return check();
  };

  socket.onerror = function (err) {
    log("onerror", err);
    queue.push([err]);
    return check();
  };

  socket.ondrain = function () {
    log("ondrain");
    if (reading) return;
    reading = true;
    source.read(onRead);
  };

  log("listeners", {
    onopen: socket.onopen,
    ondrain: socket.ondrain,
    onerror: socket.onerror,
    ondata: socket.ondata,
    onclose: socket.onclose,
  });

  return { read: read, abort: abort, sink: sink };

  function check() {
    log("check", {cb:!!cb,queue:!!queue.length});
    if (cb && queue.length) {
      var callback = cb;
      cb = null;
      callback.apply(null, queue.shift());
    }
    log("check2", {cb:!!cb,queue:!!queue.length});
    if (cb && !queue.length) {
      log("socket.resume")
      socket.resume();
    }
    else if (!cb && queue.length) {
      log("socket.suspend")
      socket.suspend();
    }
    log("aftercheck", {
      host: socket.host,
      port: socket.port,
      ssl: socket.ssl,
      bufferedAmount: socket.bufferedAmount,
      binaryType: socket.binaryType,
      readyState: socket.readyState
    });
  }

  function read(callback) {
    log("read", callback);
    if (done) return callback();
    if (cb) return callback(new Error("Only one read at a time allowed"));
    cb = callback;
    return check();
  }

  function abort(callback) {
    log("abort", callback);
    if (done) return callback();
    done = true;
    socket.ondata = null;
    socket.onclose = null;
    socket.onerror = null;
    socket.suspend();
    socket.close();
    callback();
  }

  function sink(stream, callback) {
    if (!callback) return sink.bind(this, stream);
    log("sink", stream, callback);
    if (source) throw new Error("Already has source");
    source = stream;
    finish = callback;
    reading = true;
    source.read(onRead);
  }

  function onRead(err, chunk) {
    log("onRead", err, chunk);
    reading = false;
    if (chunk === undefined) {
      socket.ondrain = null;
      socket.suspend();
      socket.close();
      return finish(err);
    }
    log("socket.send", chunk)
    if (socket.send(chunk.buffer)) {
      reading = true;
      source.read(onRead);
    }
  }

}
