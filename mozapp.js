var socket = navigator.mozTCPSocket.open('github.com', 9418, {
  binaryType: "arraybuffer"
});

socket.onopen = function () {
  send("git-upload-pack /creationix/conquest.git\0host=github.com\0");
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

socket.ondata = function (evt) {
  log("<-", toString(evt.data));
  send(null);
};

socket.onerror = function (err) {
  throw err;
};

function pktLine(line) {
  var length = line.length + 4;
  var array = new Uint8Array(length);
  var header = "";
  for (var i = 0; i < 4; i++) {
    var val = length >> (3 - i) * 4 & 0xf;
    array[i] = val + (val < 10 ? 0x30 : 0x57);
  }
  for (var i = 4; i < length; i++) {
    array[i] = line.charCodeAt(i - 4);
  }
  return array.buffer;
}

function toString(buffer) {
  return String.fromCharCode.apply(String, new Uint8Array(buffer));
}

function utf8Decode(string) {
  return decodeURIComponent(escape(string));
}

function toBuffer(string) {
  var length = string.length;
  var array = new Uint8Array(length);
  for (var i = 0; i < length; i++) {
    array[i] = string.charCodeAt(i);
  }
  return array.buffer;
}

function utf8Encode(string) {
  return unescape(encodeURIComponent(string));
}

function log(label, value) {
  var p = document.createElement('p');
  p.textContent = label + " " + value;
  document.body.appendChild(p);
  console.log(label, value);
}

