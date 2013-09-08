git-browser
===========

![js-git browser](http://creationix.com/git-browser-tile-1400x560-half.png)

Browse Git Repos offline.

## Firefox OS Build Instructions

```sh
git clone git@github.com:creationix/git-browser.git
cd git-browser
npm install
./make moz
```

Then add `build/moz/manifest.webapp` to the simulator and push it to a device.

## Chrome Packaged App Build Instructions

```sh
git clone git@github.com:creationix/git-browser.git
cd git-browser
npm install
./make chrome
```

Then go to <chrome://extensions/> and "Load unpacked extension..." and browse to `build/chrome`.

## Web App Build Instructions

This builds a web app that can run in a normal hosted webpage

```sh
git clone git@github.com:creationix/git-browser.git
cd git-browser
npm install
./make web
```

Then point your browser to `build/web/index.html`.

## Developing Instructions

Included is a `monitor.sh` script that watches for file changes and updates the build directories.

It accepts make targets as it's arguments, so simply replace `./make` in the above instructions with `./monitor.sh`.

* Note that this requires `inotifywait` which is found in the `inotify-tools` package in Ubuntu Linux.
