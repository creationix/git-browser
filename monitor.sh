#!/bin/sh
make $@
while true
  do inotifywait --exclude 'bb.*|tags|\.zedstate|node_modules.*' -e create -e delete -e modify -q -r .
  make $@
done