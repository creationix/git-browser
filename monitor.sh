make firefox && while true; do find . -name "*.js" | xargs inotifywait; make firefox; done
