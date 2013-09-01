#!/bin/sh
make $@
while true
  do inotifywait -e create -e delete -e modify -r .
  make $@
done