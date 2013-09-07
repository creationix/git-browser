#!/usr/bin/env node
var T = require('./utils/task.js');
var path = require('path');

// Override paths using environment variables
var WEBDIR = process.env.WEBDIR || "build/web";
var MOZDIR = process.env.MOZDIR || "build/moz";
var CHROMEDIR = process.env.CHROMEDIR || "build/chrome";
var MOZZIP = MOZDIR + "-app.zip";
var CHROMEZIP = CHROMEDIR + "-app.zip";

T("code", ["web", "moz", "chrome"]);

T("all", ["code", "moz-zip", "chrome-zip"]);

function base(bootstrap, targetDir) {
  return T.parallel(
    T.copy("res", targetDir),
    T.newer("src", /\.less$/, targetDir + "/style.css", 
      T.lessc("src/" + bootstrap + ".less", targetDir + "/style.css")
    ),
    T.build("src/" + bootstrap + ".js", targetDir + "/app.js")
  );
}
function zipFile(zip, dir) {
  return T.serial(
    T.parallel(
      T.rmrf(zip),
      T.mkdirp(path.dirname(zip))
    ),
    T.execFile("zip", ["-o", "-r", path.relative(dir, zip), '.'], {cwd: dir})
  );
}

T("web", base("web", WEBDIR));

T("moz", T.parallel(
  base("moz", MOZDIR),
  T.copy("src/manifest.webapp", MOZDIR + "/manifest.webapp")
));

T("moz-zip", ["moz"], zipFile(MOZZIP, MOZDIR));

T("chrome", T.parallel(
  base("chrome", CHROMEDIR),
  T.copy("src/manifest.json", CHROMEDIR + "/manifest.json"),
  T.copy("src/background.js", CHROMEDIR + "/background.js")
));

T("chrome-zip", ["chrome"], zipFile(CHROMEZIP, CHROMEDIR));

T("clean", T.rmrf("build"));

T.execute(T.run, process.argv.slice(2), function (err) {
  if (err) {
    console.error(err.stack || err);
    process.exit(-1);
  }
  // console.log("Done");
});
