var bops, HTTP1_1;
module.exports = function (platform) {
  bops = platform.bops;
  HTTP1_1 = bops.from("HTTP/1.1");
  return {
    server: {
      encoder: serverEncoder,
      decoder: serverDecoder,
    },
    client: {
      encoder: clientEncoder,
      decoder: clientDecoder,
    },
  };
};

function serverEncoder(write) {
  return function (res) {
    throw "TODO: Implement serverEncoder";
  };
}

function serverDecoder(emitReq) {
  return function (chunk) {
    throw "TODO: Implement serverDecoder";
  };
}

function clientEncoder(write) {
  return function (req) {
    console.log("req", req);
    var head = req.method + " " + req.path + " HTTP/1.1\r\n";
    Object.keys(req.headers).forEach(function (key) {
      var value = req.headers[key];
      head += key + ": " + value + "\r\n";
    });
    head += "\r\n";
    console.log(head)
    if (!req.body) {
      write(bops.from(head));
      return;
    }
    if (bops.is(req.body)) {
      write(bops.from(head));
      write(req.body);
      return;
    }
    if (typeof req.body === "string") {
      write(bops.from(head + req.body));
      return;
    }
    throw new Error("Unsupported body type");
  };
}

function clientDecoder(emit) {
  var position = 0, data = [];
  var state = $start;
  return function (chunk) {
    if (chunk === undefined) return emit();
    console.log(chunk);
    for (var i = 0, l = chunk.length; i < l; ++i) {
      console.log(state.name, i, chunk[i].toString(16), String.fromCharCode(chunk[i]));
      state = state(chunk[i]);
    }
  };
  
  function $start(byte) {
    if (byte === HTTP1_1[position++]) return $start;
    if (byte === 0x20 && position === 9) {
      position = 0;
      return $code;
    }
    throw new SyntaxError("Must be HTTP/1.1 response");
  }
  
  function $code(byte) {
    return $code;
  }
}

// var states = {
//   method: function (byte, data, emit) {
//     // Capital letter
//     if (byte > 0x40 && byte <= 0x5a) {
//       data.push(byte);
//       return "method";
//     }
//     // Space
//     if (byte === 0x20) {
//       data.method = bops.to(bops.from(data));
//       data.length = 0;
//       return "path";
//     }
//     data.push(byte);
//     emit(syntaxError("Invalid Method", data));
//     return "error";
//   },
//   path: function (byte, data, emit) {
//     if (byte === 0x20) {
//       data.path = bops.to(bops.from(data));
//       data.length = 0;
//       return "version";
//     }
//     if (byte === 0x0d || byte === 0x0a) {
//       data.push(byte);
//       emit(syntaxError("Unexpected newline in path", data));
//       return "error";
//     }
//     data.push(byte);
//     return "path";
//   },
//   version: function (byte, data, emit) {
//     if (byte === 0x0d) {
//       var match = bops.to(bops.from(data)).match(/HTTP\/(1).([01])/);
//       if (!match) {
//         emit(syntaxError("Invalid HTTP version string", data));
//         return "error";
//       }
//       data.version = [parseInt(match[1], 10), parseInt(match[2], 10)];
//       data.length = 0;
//       return "endhead";
//     }
//     data.push(byte);
//     return "version";
//   },
//   endhead: function (byte, data, emit) {
//     if (byte === 0x0a) {
//       data.headers = [];
//       return "key";
//     }
//     emit(new SyntaxError("Syntax Error in newline after HTTP request header"));
//   },
//   key: function (byte, data, emit) {
//     if (byte === 0x0d) {
//       if (data.length === 0) {
//         return "endheaders";
//       }
//       emit(new SyntaxError("Unexpected newline"));
//       return "error";
//     }
//     if (byte === 0x3a) {
//       data.headers.push(bops.to(bops.from(data)));
//       data.length = 0;
//       return "value";
//     }
//     data.push(byte);
//     return "key";
//   },
//   value: function (byte, data) {
//     if (byte === 0x0d) {
//       data.headers.push(bops.to(bops.from(data)));
//       data.length = 0;
//       return "endheader";
//     }
//     if (byte === 0x20 && data.length === 0) {
//       // Ignore leading spaces in header values
//       return "value";
//     }
//     data.push(byte);
//     return "value";
//   },
//   endheader: function (byte, data, emit) {
//     if (byte === 0x0a) {
//       return "key";
//     }
//     emit(new SyntaxError("Invalid line termination"));
//     return "error";
//   },
//   endheaders: function (byte, data, emit) {
//     if (byte === 0x0a) {
//       emit(null, {
//         method: data.method,
//         path: data.path,
//         version: data.version,
//         headers: data.headers,
//       });
//       return "body";
//     }
//     emit(new SyntaxError("Invalid head termination"));
//     return "error";
//   },
//   error: function (byte, data, emit) {
//     emit();
//     return "error";
//   },
//   body: function (byte, data) {
//     data.push(byte);
//     return "body";
//   }
// };


// exports.decoder = decoder;
// function decoder(emit) {

//   var state = "method";
//   var data = [];

//   var fn = function (err, chunk) {
//     if (chunk === undefined) return emit(err);
//     for (var i = 0, l = chunk.length; i < l; i++) {
//       state = states[state](chunk[i], data, emit);
//     }
//     if (state === "body" && data.length) {
//       emit(null, bops.from(data));
//       data.length = 0;
//     }
//   };
//   fn.is = "min-stream-write";
//   return fn;
// }
// decoder.is = "min-stream-push-filter";



// exports.encoder = encoder;
// function encoder(emit) {
//   var fn = function (err, item) {
//     if (item === undefined) return emit(err);
//     if (typeof item === "string") {
//       return emit(null, bops.from(item));
//     }
//     if (bops.is(item)) {
//       return emit(null, item);
//     }
//     var head = "HTTP/1.1 " + item.statusCode + " " + STATUS_CODES[item.statusCode] + "\r\n";
//     for (var i = 0, l = item.headers.length; i < l; i += 2) {
//       head += item.headers[i] + ": " + item.headers[i + 1] + "\r\n";
//     }
//     head += "\r\n";
//     emit(null, bops.from(head));
//   };
//   fn.is = "min-stream-write";
//   return fn;
// }
// encoder.is = "min-stream-push-filter";
// function syntaxError(message, array) {
//   return new SyntaxError(message + ": " +
//     JSON.stringify(bops.to(bops.from(array)))
//   );
// }
  
var STATUS_CODES = {
  '100': 'Continue',
  '101': 'Switching Protocols',
  '102': 'Processing',                 // RFC 2518, obsoleted by RFC 4918
  '200': 'OK',
  '201': 'Created',
  '202': 'Accepted',
  '203': 'Non-Authoritative Information',
  '204': 'No Content',
  '205': 'Reset Content',
  '206': 'Partial Content',
  '207': 'Multi-Status',               // RFC 4918
  '300': 'Multiple Choices',
  '301': 'Moved Permanently',
  '302': 'Moved Temporarily',
  '303': 'See Other',
  '304': 'Not Modified',
  '305': 'Use Proxy',
  '307': 'Temporary Redirect',
  '400': 'Bad Request',
  '401': 'Unauthorized',
  '402': 'Payment Required',
  '403': 'Forbidden',
  '404': 'Not Found',
  '405': 'Method Not Allowed',
  '406': 'Not Acceptable',
  '407': 'Proxy Authentication Required',
  '408': 'Request Time-out',
  '409': 'Conflict',
  '410': 'Gone',
  '411': 'Length Required',
  '412': 'Precondition Failed',
  '413': 'Request Entity Too Large',
  '414': 'Request-URI Too Large',
  '415': 'Unsupported Media Type',
  '416': 'Requested Range Not Satisfiable',
  '417': 'Expectation Failed',
  '418': 'I\'m a teapot',              // RFC 2324
  '422': 'Unprocessable Entity',       // RFC 4918
  '423': 'Locked',                     // RFC 4918
  '424': 'Failed Dependency',          // RFC 4918
  '425': 'Unordered Collection',       // RFC 4918
  '426': 'Upgrade Required',           // RFC 2817
  '500': 'Internal Server Error',
  '501': 'Not Implemented',
  '502': 'Bad Gateway',
  '503': 'Service Unavailable',
  '504': 'Gateway Time-out',
  '505': 'HTTP Version not supported',
  '506': 'Variant Also Negotiates',    // RFC 2295
  '507': 'Insufficient Storage',       // RFC 4918
  '509': 'Bandwidth Limit Exceeded',
  '510': 'Not Extended'                // RFC 2774
};
