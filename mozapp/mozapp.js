
var socket = navigator.mozTCPSocket.open('github.com', 9418, {
  binaryType: "arraybuffer"
});

window.log = log;
socket = require('./trace-socket.js')(socket);

socket.onopen = function () {
  send("git-upload-pack /creationix/conquest.git\0host=github.com\0");
  setTimeout(function () {
    send("want 39a63c86fed320e06c84af7cf311c38f4395ff00 ofs-delta thin-pack include-tag side-band-64k agent=jsgit/0.3.0\n");
    send("want edc154eab21edfcda42e2087dcba02eeffd6550d\n");
    send("want 709d18d775cf6f970db26fa771da347fbb7d9151\n");
    send(null);
    send("done\n");
  }, 500);
};

socket.ondata = function (evt) {
  log("<-", toString(evt.data));
};

socket.onerror = function (err) {
  throw err;
};

function send(string) {
  var line;
  if (string === null) {
    line = toBuffer("0000");
  }
  else {
    line = pktLine(string);
  }
  log("->", toString(line));
  socket.send(line);
}


function pktLine(line) {
  var length = line.length + 4;
  var array = new Uint8Array(length);
  for (var i = 0; i < 4; i++) {
    var val = length >> (3 - i) * 4 & 0xf;
    array[i] = val + (val < 10 ? 0x30 : 0x57);
  }
  for (i = 4; i < length; i++) {
    array[i] = line.charCodeAt(i - 4);
  }
  return array.buffer;
}

function toString(buffer) {
  return String.fromCharCode.apply(String, new Uint8Array(buffer));
}

function toBuffer(string) {
  var length = string.length;
  var array = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    array[i] = string.charCodeAt(i);
  }
  return array.buffer;
}

function log(label, value) {
  var p = document.createElement('p');
  p.textContent = label + " " + value;
  document.body.appendChild(p);
  console.log(label, value);
}

