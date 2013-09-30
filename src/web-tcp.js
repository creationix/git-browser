exports.connect = connect;
exports.tcp = { connect: connect.bind(null, "tcp") };
exports.tls = { connect: connect.bind(null, "tls") };

function connect(protocol, port, host, callback) {
  if (typeof host === "function" && typeof callback === "undefined") {
    callback = host;
    host = "127.0.0.1";
  }
  if (!callback) return connect.bind(this, port, host);
  if (typeof port !== "number") throw new TypeError("port must be number");
  if (typeof host !== "string") throw new TypeError("host must be string");
  if (typeof callback !== "function") throw new TypeError("callback must be function");
  var url = (document.location.protocol + "//" + document.location.host + "/").replace(/^http/, "ws") + protocol + "/" + host + "/" + port;
  var ws = new WebSocket(url, "tcp");
  ws.binaryType = 'arraybuffer';
  ws.onopen = function (evt) {
    ws.onmessage = function (evt) {
      if (evt.data === "connect") return callback(null, wrapSocket(ws));
      callback(new Error(evt.data));
    };
  };
}

function wrapSocket(ws) {
  var queue = [];
  var done, cb;
  var source, finish;

  ws.onmessage = function (evt) {
    var data = evt.data;
    if (typeof data === "string") {
      queue.push([new Error(data)]);
    }
    else {
      var str = "";
      data = new Uint8Array(data);
      for (var i = 0, l = data.length; i < l; i++) {
        str += String.fromCharCode(data[i]);
      }
      queue.push([null, data]);
    }
    return check();
  };

  ws.onclose = function (evt) {
    queue.push([]);
    return check();
  };

  ws.onerror = function (evt) {
    queue.push([new Error("Websocket connection closed")]);
    return check();
  };

  return { read: read, abort: abort, sink: sink };

  function read(callback) {
    if (done) return callback();
    if (cb) return callback(new Error("Only one read at a time allowed"));
    cb = callback;
    return check();
  }

  function check() {
    if (cb && queue.length) {
      var callback = cb;
      cb = null;
      callback.apply(null, queue.shift());
    }
  }

  function abort(callback) {
    if (done) return callback();
    done = true;
    ws.onmessage = null;
    ws.onclose = null;
    ws.onerror = null;
    try { ws.close(); } catch (err) {}
    callback();
  }

  function sink(stream, callback) {
    if (!callback) return sink.bind(this, stream);
    if (source) throw new Error("Already has source");
    source = stream;
    finish = callback;
    source.read(onRead);
  }

  function onRead(err, chunk) {
    if (chunk === undefined) {
      try {
        ws.close();
      } catch (err) {}
      return finish(err);
    }
    ws.send(chunk);
    source.read(onRead);
  }

}