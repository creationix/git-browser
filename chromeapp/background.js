/*global chrome*/
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('/chromeapp/index.html', {
    id: "git-browse-app-main",
  });
});
