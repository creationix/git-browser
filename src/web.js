
function getRepos(callback) {
  callback(null, [
    {
      name: "creationix/msgpack-js",
      description: "The msgpack protocol implemented in pure javascript.",
      db: require('../repos/msgpack-js.json')
    },
    {
      name: "creationix/conquest",
      description: "A remake of the classic Lords of Conquest for C64 implemented in JavaScript",
      db: require('../repos/conquest.json')
    },
    {
      name: "creationix/gen-run",
      description: "Generator Async Runner. Makes it possible to yield and wait for callbacks and continuables.",
      db: require('../repos/gen-run.json')
    },
    {
      name: "creationix/rec",
      description: "A tool for recording CLI programs and posting their output",
      db: require('../repos/rec.json')
    },
    {
      name: "creationix/dombuilder",
      description: "An easy dombuilder using json-ml style syntax",
      db: require('../repos/dombuilder.json')
    },
    {
      name: "creationix/domlog",
      description: "A simple on-screen logger using dombuilder to create elements.",
      db: require('../repos/domlog.json')
    },
    {
      name: "creationix/push-to-pull",
      description: "Convert a push-filter to a pull-filter (for simple streams) ",
      db: require('../repos/push-to-pull.json')
    },
    {
      name: "creationix/uvrun",
      description: "Tiny node module to expose uv_run and uv_run_once to JavaScript",
      db: require('../repos/uvrun.json')
    },
    {
      name: "creationix/mine",
      description: "Miner digs into a javascript file looking for require calls. Used to statically extract common js dependencies.",
      db: require('../repos/mine.json')
    },
  ]);
}

// Returns a stream that emits one commit at time starting with hash.
// Commits are sorted by author date.
function getHistoryStream(repo, callback) {
  var db = repo.db;
  var hash = db.refs["refs/heads/master"];
  // queue of hashes/date pairs sorted by date
  var queue = [];
  // hashes we've already put in the queue
  var seen = {};
  var done = false;
  if (hash) {
    enqueue(hash);
  }
  else {
    var keys = Object.keys(db.refs);
    for (var i = 0, l = keys.length; i < l; i++) {
      enqueue(db.refs[keys[i]]);
    }
  }

  callback(null, { read: read, abort: abort });

  function read(callback) {
    if (done) return callback();
    var next = queue.pop();
    if (!next) return abort(callback);
    next = next[0];
    if (next.parents) {
      next.parents.forEach(enqueue);
    }
    setTimeout(function () {
      callback(null, next);
    }, 10);
  }

  function abort(callback) {
    done = true;
    queue = null;
    seen = null;
    callback();
  }

  function enqueue(hash) {
    if (hash in seen) return;
    var object = db.objects[hash];
    if (!object) throw new Error("Unknown hash " + hash);
    if (object.type !== "commit") return;
    var commit = object.body;
    commit.hash = hash;
    var match = commit.author.match(/([0-9]+) ([\-+]?[0-9]+)$/);
    var timestamp = match[1];
    if (!timestamp) throw new Error("Invalid timestamp in " + commit.author);
    timestamp = parseInt(timestamp, 10);
    var index = queue.length;
    while (index > 0 && queue[index - 1][1] > timestamp) index--;
    queue.splice(index, 0, [commit, timestamp]);
    seen[hash] = true;
  }

}

function getHash(repo, hash, callback) {
  callback(null, repo.db.objects[hash].body);
}

require('./main.js')({
  getRepos: getRepos,
  getHistoryStream: getHistoryStream,
  getCommit: getHash,
  getTree: getHash
});
