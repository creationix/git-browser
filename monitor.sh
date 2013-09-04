#!/bin/sh
make $@
while true
  do inotifywait --exclude 'bb.*|tags|\.zedstate|node_modules.*|build.*|\.git.*' -e create -e delete -e modify -q -r .
  make $@
done