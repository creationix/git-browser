#!/usr/bin/env node
var T = require('tim-task');
var path = require('path');

// Override paths using environment variables
var WEBDIR = process.env.WEBDIR || "build/web";
var MOZDIR = process.env.MOZDIR || "build/moz";
var CHROMEDIR = process.env.CHROMEDIR || "build/chrome";
var WEBOSDIR = process.env.WEBOSDIR || "build/webos";
var MOZZIP = MOZDIR + "-app.zip";
var CHROMEZIP = CHROMEDIR + "-app.zip";
var IPK = "build/com.creationix.git-browser_0.0.1_all.ipk";

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

T("web", T.serial(
  T.parallel(
    T.copy("src/server.js", WEBDIR + "/server.js"),
    base("web", WEBDIR)
  ),
  T.manifest(WEBDIR, [
    "index.html",
    "style.css",
    "app.js",
    "prism.css"
  ], "git-browser.appcache")
));

T("web-localstorage", T.serial(
  T.parallel(
    T.copy("src/server.js", WEBDIR + "/server.js"),
    base("web-localstorage", WEBDIR)
  ),
  T.manifest(WEBDIR, [
    "index.html",
    "style.css",
    "app.js",
    "prism.css"
  ], "git-browser.appcache")
));

T("webos", T.parallel(
  base("webos", WEBOSDIR),
  T.copy("src/appinfo.json", WEBOSDIR + "/appinfo.json")
));

T("webos", T.parallel(
  base("webos", WEBOSDIR),
  T.copy("src/appinfo.json", WEBOSDIR + "/appinfo.json")
));

T("webos-ipk", ["webos"], T.newer(WEBOSDIR, /.*/, IPK,
  T.execFile("palm-package", [path.relative("build", WEBOSDIR)], {cwd:"build"})
));

T("webos-install", ["webos-ipk"],
  T.execFile("palm-install", [IPK], {})
);

T("webos-run", ["webos-install"],
  T.execFile("palm-launch", ["com.creationix.git-browser"], {})
);

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
