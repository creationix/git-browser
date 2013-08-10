chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('/chromeapp.html', {
    id: "git-browse-app-main",
  });
});
