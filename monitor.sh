make && while true; do find . -name "*.js" | xargs inotifywait -e modify -e create; make; done
