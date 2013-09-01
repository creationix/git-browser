require('js-git/lib/platform.js')(require('js-git-node-platform'));
var db = require('../app/git-memdb.js')();

// Load the libraries
var wrap = require('js-git/lib/repo.js');
var autoProto = require('js-git/protocols/auto.js');
var urlParse = require('url').parse;
var serial = require('js-git/helpers/serial.js');
var parallel = require('js-git/helpers/parallel.js');
var parallelData = require('js-git/helpers/parallel-data.js');
var decoders = require('js-git/lib/decode.js');

var url = process.argv[2] || "git://github.com/creationix/conquest.git";
var opts = urlParse(url);
if (!opts.protocol) {
  opts = urlParse("ssh://" + url);
}
var path = opts.pathname.match(/[^\/]*$/)[0].replace(/git$/, "json");

var connection = autoProto(opts);
var repo = wrap(db, true);

var config = {
  includeTag: true,
  onProgress: function (data) {
    process.stdout.write(data);
  },
  onError: function (data) {
    process.stderr.write(data);
  }
};

parallelData({
  init: repo.init(),
  pack: connection.fetch(config),
}, function (err, result) {
  if (err) throw err;
  serial(
    parallel(
      repo.importRefs(result.pack.refs),
      repo.unpack(result.pack, config)
    ),
    connection.close()
  )(function (err) {
    if (err) throw err;
    var refs = {};
    var objects = {};
    var isHash = /^[0-9a-f]{40}$/;
    Object.keys(db.db).forEach(function (key) {
      var value = db.db[key];
      if (!isHash.test(key)) {
        return refs[key] = value;
      }
      var body = decoders[value.type](value.body);
      if (Buffer.isBuffer(body)) body = body.toString('binary');
      objects[key] = {
        type: value.type,
        body: body
      };
    });
    console.error("Writing " + path);
    require('fs').writeFile(path, JSON.stringify({
      refs: refs,
      objects: objects
    }));
  });
});
