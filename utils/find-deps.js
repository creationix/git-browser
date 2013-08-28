var fs = require('fs');
var dirname = require('path').dirname;
var pathJoin = require('path').join;

var mine = require('./mine.js');
var modules = {};

exports.add = add;
function add(name) {

}

exports.flush = flush;
function flush() {
  var output = modules;
  modules = {};
  return output;
}

function add(path) {
  if (path in modules) return path;
  var base = dirname(path);
  var code = fs.readFileSync(path, "utf8");
  var adjust = 0;
  mine(code).forEach(function (match) {
    var name = match.name;
    var oldLen = name.length;
    var newPath = baseResolve(base, name);
    var newLen = newPath.length;
    var offset = adjust + match.offset;
  });
  modules[path] = new Buffer(code);
  return path;
}

function baseResolve(base, name) {
  if (name[0] === "/") return localResolve(name);
  if (name[0] === ".") return localResolve(pathJoin(base, name));
  var newBase = base;
  while (true) {
    var result = localResolve(pathJoin(newBase, "node_modules", name));
    if (result) return result;
    if (newBase.length === 1) {
      throw new Error("ENOENT: Can't find " + name + " relative to " + base);
    }
    newBase = dirname(newBase);
  }
}

function localResolve(path) {
  if (/\.js$/.test(path)) {
    if (fs.existsSync(path)) return add(path);
    return false;
  }
  var packagePath = pathJoin(path, "package.json");
  if (fs.existsSync(packagePath)) {
    var json = fs.readFileSync(packagePath);
    var meta = JSON.parse(json);
    return add(pathJoin(path, meta.main));
  }
  var indexPath = pathJoin(path, "index.js");
  if (fs.existsSync(indexPath)) {
    return add(indexPath);
  }
  return false;
}
