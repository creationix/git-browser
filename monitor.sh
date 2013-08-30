make firefox && while true; do find . -name "*.js" | xargs inotifywait; make firefox chrome; done
