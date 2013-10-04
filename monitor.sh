#!/bin/sh
./make $@
while true
  do inotifywait -e create -e delete -e modify -q -r src res node_modules
  ./make $@
done
