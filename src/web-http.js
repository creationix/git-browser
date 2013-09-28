var tcp = require('./web-tcp.js');
var pushToPull = require('push-to-pull');
var http = require('./http-codec.js');
var decoder = pushToPull(http.client.decoder);
var encoder = http.client.encoder;
var writable = require('git-net/writable.js');

exports.request = request;
function request(opts, callback) {
  if (opts.tls) return callback(new Error("https not supported"));
  tcp.connect(opts.port, opts.hostname, function (err, socket) {
    if (err) return callback(err);
    var output = writable(socket.abort);
    socket.sink(output);
    var write = encoder(output);
    write({
      method: opts.method,
      path: opts.path,
      headers: opts.headers
    });
    decoder(socket).read(callback);
  });
}
