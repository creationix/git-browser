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

  var socket = TCPSocket.open(host, port, { binaryType: "arraybuffer" });

  socket.onopen = function () {
    socket.onopen = null;
    callback(null, wrapSocket(socket));
  };

  socket.onerror = function (err) {
    callback(new Error("Connection Error: " + err.type));
  };
}

function wrapSocket(socket) {
  var done = false;
  var cb = null;
  var queue = [];
  var reading = false;
  var source = null;
  var paused = false;
  var finish;

  socket.ondata = function (evt) {
    var chunk = new Uint8Array(evt.data);
    queue.push([null, chunk]);
    return check();
  };

  socket.onclose = function () {
    log("onclose")
    queue.push([]);
    return check();
  };
  
  socket.onerror = function (err) {
    log("onerror", err);
    // log("onerror", err, {
    //   target:err.target,
    //   type:err.type,
    //   canBubble: err.canBubble,
    //   cancelable: err.cancelable,
    //   view: err.view,
    //   detail: err.detail
    // });
    log("readyState", socket.readyState);
    
    debugger;
    
    queue.push([err]);
    return check();
  };

  socket.ondrain = function () {
    if (reading) return;
    reading = true;
    source.read(onRead);
  };

  return { read: read, abort: abort, sink: sink };

  function check() {
    log("check", {cb:!!cb,queue:!!queue.length});
    if (cb && queue.length) {
      var callback = cb;
      cb = null;
      callback.apply(null, queue.shift());
    }
    log("check2", {cb:!!cb,queue:!!queue.length});
    if (paused && cb && !queue.length) {
      log("socket.resume")
      paused = false;
      socket.resume();
    }
    else if (!paused && !cb && queue.length) {
      log("socket.suspend")
      paused = true;
      socket.suspend();
    }
  }

  function read(callback) {
    if (done) return callback();
    if (cb) return callback(new Error("Only one read at a time allowed"));
    cb = callback;
    return check();
  }

  function abort(callback) {
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
    if (source) throw new Error("Already has source");
    source = stream;
    finish = callback;
    reading = true;
    source.read(onRead);
  }

  function onRead(err, chunk) {
    reading = false;
    if (chunk === undefined) {
      socket.ondrain = null;
      socket.suspend();
      socket.close();
      return finish(err);
    }
    if (socket.send(chunk.buffer)) {
      reading = true;
      source.read(onRead);
      log("EMPTY")
    }
    else {
      log("FULL!")
    }
    log({bufferedAmount:socket.bufferedAmount})
  }

}
