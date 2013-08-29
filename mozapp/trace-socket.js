module.exports = traceSocket;

function tap(name, fn, thisp) {
  return function () {
    var args = [name];
    for (var i = 0, l = arguments.length; i < l; i++) {
      args.push(arguments[i]);
    }
    log.apply(null, args);
    return fn.apply(thisp || this, arguments);
  };
}
function traceSocket(real) {
  return {
    get onopen() { log("GET onopen"); return real.onopen; },
    set onopen(fn) { log("SET onopen", fn); return real.onopen = tap("ONOPEN", fn); },
    get ondata() { log("GET ondata"); return real.ondata; },
    set ondata(fn) { log("SET ondata", fn); return real.ondata = tap("ONDATA", fn); },
    get onclose() { log("GET onclose"); return real.onclose; },
    set onclose(fn) { log("SET onclose", fn); return real.onclose = tap("ONCLOSE", fn); },
    get onerror() { log("GET onerror"); return real.onerror; },
    set onerror(fn) { log("SET onerror", fn); return real.onerror = tap("ONERROR", fn); },
    get ondrain() { log("GET ondrain"); return real.ondrain; },
    set ondrain(fn) { log("SET ondrain", fn); return real.ondrain = tap("ONDRAIN", fn); },
    close: tap("CLOSE", real.close, real),
    send: tap("SEND", real.send, real),
    suspend: tap("SUSPEND", real.suspend, real),
    resume: tap("RESUME", real.resume, real),
  };
}
