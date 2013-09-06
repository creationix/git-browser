#!/usr/bin/env node

var task = require('./utils/task.js');
var copy = task.copy;
var rmrf = task.rmrf;
var parallel = task.parallel;
var lessc = task.lessc;
var build = task.build;

task("web-app", parallel(
  copy("res", "build/web-app"),
  lessc("src/style.less", "build/web-app/style.css"),
  build("src/web.js", "build/web-app/app.js")
));

task("clean", rmrf("build"));

task.execute(task.run, process.argv.slice(2))(function (err) {
  if (err) {
    console.error(err.stack || err);
    process.exit(-1);
  }
  console.log("Done");
});