#!/bin/sh

set -eu

scheduler_pid=''
web_pid=''

shutdown() {
    if [ -n "$scheduler_pid" ] && kill -0 "$scheduler_pid" 2>/dev/null; then
        kill "$scheduler_pid" 2>/dev/null || true
        wait "$scheduler_pid" 2>/dev/null || true
    fi
}

trap shutdown INT TERM EXIT

php artisan schedule:work &
scheduler_pid=$!

frankenphp php-server -r public/ &
web_pid=$!

while kill -0 "$web_pid" 2>/dev/null; do
    if ! kill -0 "$scheduler_pid" 2>/dev/null; then
        wait "$scheduler_pid"
        exit 1
    fi

    sleep 1
done

wait "$web_pid"
