var http = require('http');
var WebSocketServer = require('ws').Server;
var send = require('send');
var net = require('net');

var server = http.createServer(onRequest);
var wss = new WebSocketServer({server: server});
server.listen(8001);
console.log("HTTP server listening on", server.address());

function onRequest(req, res) {
  send(req, req.url)
    .root(__dirname)
    .pipe(res);
}

wss.on('connection', function(ws) {
  var req = ws.upgradeReq;
  if (req.host !== req.origin) {
    ws.send("Only same origin allowed");
    ws.close();
    return;
  }
  var match = req.url.match(/^\/([^\/]+)\/([0-9]+)$/);
  if (!match) {
    ws.send("Invalid request url.\nMust be /:host/:port");
    ws.close();
    return;
  }
  console.log("ws<->tcp Client connected");
  var host = match[1];
  var port = parseInt(match[2], 10);
  var s = net.connect({host: host, port: port});
  s.on("connect", function () {
    ws.send("connect");
    console.log("Connected to %s:%s", host, port);
    s.on("error", function (err) {
      try {
        ws.send(err);
        ws.close();
      } catch (err) {}
    });
    ws.on('message', function (message) {
      try {
        s.write(message);
      } catch (err) {}
    });
    ws.on('close', function () {
      try {
        s.end();
      } catch (err) {}
    });
    s.on('data', function (chunk) {
      try {
        ws.send(chunk);
      } catch (err) {}
    });
    s.on('close', function () {
      try {
        ws.close();
      } catch (err) {}
    });
  });
});
