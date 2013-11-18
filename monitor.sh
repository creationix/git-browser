#!/bin/sh
./make.js $@
while true
  do inotifywait -e create -e delete -e modify -q -r src res node_modules
  ./make.js $@
done
