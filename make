#!/usr/bin/env node

var T = require('./utils/task.js');

T("all", ["web-app", "firefox-app", "chrome-app"]);

T("web-app", T.parallel(
  T.copy("res", "build/web-app"),
  T.lessc("src/style.less", "build/web-app/style.css"),
  T.build("src/web.js", "build/web-app/app.js")
));

T("firefox-app", T.parallel(
  T.copy("res", "build/firefox-app"),
  T.lessc("src/style.less", "build/firefox-app/style.css"),
  T.build("src/firefox.js", "build/firefox-app/app.js")
));

T("chrome-app", T.parallel(
  T.copy("res", "build/chrome-app"),
  T.lessc("src/style.less", "build/chrome-app/style.css"),
  T.build("src/chrome.js", "build/chrome-app/app.js")
));

T("clean", T.rmrf("build"));

T.execute(T.run, process.argv.slice(2), function (err) {
  if (err) {
    console.error(err.stack || err);
    process.exit(-1);
  }
  console.log("Done");
});