var bops, tls, tcp, http, decoder, encoder, trace;
var pushToPull = require('push-to-pull');
var writable = require('git-net/writable.js');
module.exports = function (platform) {
  bops = platform.bops;
  tcp = platform.tcp;
  tls = platform.tls;
  trace = platform.trace;
  http = require('./http-codec.js')(platform);
  decoder = pushToPull(http.client.decoder);
  encoder = http.client.encoder;
  return { request: request };
};

function request(opts, callback) {
  if (opts.tls && !tls) return callback(new Error("secure https not supported"));
  if (!opts.tls && !tcp) return callback(new Error("plain http not supported"));

  if (trace) trace("request", null, {
    method: opts.method,
    host: opts.hostname,
    port: opts.port,
    path: opts.path,
    headers: opts.headers
  });

  var read, abort, write;

  return (opts.tls ? tls : tcp).connect(opts.port, opts.hostname, onConnect);

  function onConnect(err, socket) {
    if (err) return callback(err);
    var input = decoder(socket);
    read = input.read;
    abort = input.abort;
    var output = writable(socket.abort);
    socket.sink(output, onEnd);
    write = encoder(output);
    write({
      method: opts.method,
      path: opts.path,
      headers: objToPairs(opts.headers)
    });
    read(onResponse);
    if (opts.body) {
      var body = opts.body;
      if (typeof body === "string") body = bops.from(body);
      if (bops.is(body)) {
        return write(body);
      }
      throw "TODO: streaming request body";
    }
  }

  function onResponse(err, res) {
    if (err) return callback(err);
    var headers = pairsToObj(res.headers);

    if (trace) trace("response", null, {
      code: res.code,
      headers: headers
    });

    callback(null, res.code, headers, {read:read,abort:abort});

  }

  function onEnd(err) {
    if (err) throw err;
  }

}

function objToPairs(obj) {
  return Object.keys(obj).map(function (key) {
    return [key, obj[key]];
  });
}

function pairsToObj(pairs) {
  var obj = {};
  pairs.forEach(function (pair) {
    obj[pair[0].toLowerCase()] = pair[1];
  });
  return obj;
}
