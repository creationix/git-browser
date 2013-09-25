var progMatch = /^([^:]*):[^\(]*\(([0-9]+)\/([0-9]+)\)/;
var progMatchBasic = /^([^:]*)/;
module.exports = progressParser;
function progressParser(emit) {
  var buffer = "";
  return function (chunk) {
    var start = 0;
    for (var i = 0, l = chunk.length; i < l; ++i) {
      var c = chunk[i];
      if (c === "\r" || c === "\n") {
        buffer += chunk.substr(start, i);
        start = i + 1;
        var match = buffer.match(progMatch) ||
                    buffer.match(progMatchBasic);
        buffer = "";
        if (!match) continue;
        emit(match[1], parseInt(match[2], 10), parseInt(match[3], 10));
      }
    }
    buffer += chunk.substr(start);
  };
}
