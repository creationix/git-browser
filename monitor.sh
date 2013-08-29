make firefox && while true; do find . -name "*.js" | xargs inotifywait -e modify -e create; make firefox; done
