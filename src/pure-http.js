var tls, tcp, http, decoder, encoder;
var pushToPull = require('push-to-pull');
var writable = require('git-net/writable.js');
module.exports = function (platform) {
  tcp = platform.tcp;
  tls = platform.tls;
  http = require('./http-codec.js')(platform);
  decoder = pushToPull(http.client.decoder);
  encoder = http.client.encoder;
  return { request: request };
};

function request(opts, callback) {
  if (opts.tls && !tls) return callback(new Error("secure https not supported"));
  if (!opts.tls && !tcp) return callback(new Error("plain http not supported"));
  var socket;

  return (opts.tls ? tls : tcp).connect(opts.port, opts.hostname, onConnect);
  
  function onConnect(err, result) {
    if (err) return callback(err);
    socket = result;
    var output = writable(socket.abort);
    socket.sink(output, onEnd);
    var write = encoder(output);
    write({
      method: opts.method,
      path: opts.path,
      headers: opts.headers
    });
    decoder(socket).read(onResponse);
  }
  
  function onResponse(err, res) {
    if (err) return callback(err);
    console.log("RES", res);
  }

  function onEnd(err) {
    if (err) return callback(err);
  }

}
