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
    callback(new Error(err.data.name));
  };
}

function tap(name, fn, thisp) {
  return function () {
    var args = [name];
    for (var i = 0, l = arguments.length; i < l; i++) {
      args.push(arguments[i]);
    }
    log.apply(null, args);
    return fn.apply(thisp || this, arguments);
  };
}
function traceSocket(real) {
  return {
    get ondata() { log("GET ondata"); return real.ondata; },
    set ondata(fn) { log("SET ondata", fn); return real.ondata = tap("ONDATA", fn); },
    get onclose() { log("GET onclose"); return real.onclose; },
    set onclose(fn) { log("SET onclose", fn); return real.onclose = tap("ONCLOSE", fn); },
    get onerror() { log("GET onerror"); return real.onerror; },
    set onerror(fn) { log("SET onerror", fn); return real.onerror = tap("ONERROR", fn); },
    get ondrain() { log("GET ondrain"); return real.ondrain; },
    set ondrain(fn) { log("SET ondrain", fn); return real.ondrain = tap("ONDRAIN", fn); },
    close: tap("CLOSE", real.close, real),
    send: tap("SEND", real.send, real),
    suspend: tap("SUSPEND", real.suspend, real),
    resume: tap("RESUME", real.resume, real),
  };
}


function wrapSocket(socket) {
  socket = traceSocket(socket);
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
    queue.push([]);
    return check();
  };
  
  socket.onerror = function (err) {
    err = new Error(err.data.name);
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
    if (cb && queue.length) {
      var callback = cb;
      cb = null;
      callback.apply(null, queue.shift());
    }
    if (paused && cb && !queue.length) {
      paused = false;
      socket.resume();
    }
    else if (!paused && !cb && queue.length) {
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
    }
  }

}
