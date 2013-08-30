module.exports = traceSocket;

function tap(name, fn, thisp) {
  return function () {
    var args = [name];
    for (var i = 0, l = arguments.length; i < l; i++) {
      args.push(arguments[i]);
    }
    console.log.apply(null, args);
    return fn.apply(thisp || this, arguments);
  };
}
function traceSocket(real) {
  console.log("TRACE", real);
  return {
    get onopen() { console.log("GET onopen"); return real.onopen; },
    set onopen(fn) { console.log("SET onopen", fn); return real.onopen = tap("ONOPEN", fn); },
    get ondata() { console.log("GET ondata"); return real.ondata; },
    set ondata(fn) { console.log("SET ondata", fn); return real.ondata = tap("ONDATA", fn); },
    get onclose() { console.log("GET onclose"); return real.onclose; },
    set onclose(fn) { console.log("SET onclose", fn); return real.onclose = tap("ONCLOSE", fn); },
    get onerror() { console.log("GET onerror"); return real.onerror; },
    set onerror(fn) { console.log("SET onerror", fn); return real.onerror = tap("ONERROR", fn); },
    get ondrain() { console.log("GET ondrain"); return real.ondrain; },
    set ondrain(fn) { console.log("SET ondrain", fn); return real.ondrain = tap("ONDRAIN", fn); },
    close: tap("CLOSE", real.close, real),
    send: tap("SEND", real.send, real),
    suspend: tap("SUSPEND", real.suspend, real),
    resume: tap("RESUME", real.resume, real),
  };
}
