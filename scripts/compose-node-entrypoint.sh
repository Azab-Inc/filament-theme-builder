#!/bin/sh

set -eu

lock_hash=$(sha256sum package-lock.json | cut -d ' ' -f 1)
marker="node_modules/.compose-lock-${lock_hash}"

if [ ! -x node_modules/.bin/vite ] || [ ! -f "$marker" ]; then
    attempts=0
    until npm ci --prefer-offline --no-audit --no-fund; do
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 5 ]; then
            echo "Unable to install npm dependencies after ${attempts} attempts" >&2
            exit 1
        fi
        sleep $((attempts * 5))
    done
    find node_modules -maxdepth 1 -name '.compose-lock-*' -delete
    touch "$marker"
fi

exec npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
