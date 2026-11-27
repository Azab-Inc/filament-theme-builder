#!/bin/sh

set -eu

: "${HOST_UID:=1000}"
: "${HOST_GID:=1000}"
case "$HOST_UID:$HOST_GID" in
    *[!0-9:]*|:) echo "HOST_UID and HOST_GID must be numeric" >&2; exit 1 ;;
esac

if ! command -v su >/dev/null 2>&1 || ! command -v adduser >/dev/null 2>&1 || ! command -v addgroup >/dev/null 2>&1 || ! command -v getent >/dev/null 2>&1; then
    echo "su, adduser, addgroup, and getent are required by the Node runtime ownership boundary" >&2
    exit 1
fi

export HOME=/tmp
export NPM_CONFIG_CACHE=/tmp/npm-cache
mkdir -p node_modules "$NPM_CONFIG_CACHE"
chown -R "$HOST_UID:$HOST_GID" node_modules "$NPM_CONFIG_CACHE"

runtime_group=$(getent group "$HOST_GID" | cut -d: -f1 || true)
if [ -z "$runtime_group" ]; then
    runtime_group=ftbhost
    addgroup -S -g "$HOST_GID" "$runtime_group"
fi
runtime_user=$(getent passwd "$HOST_UID" | cut -d: -f1 || true)
if [ -z "$runtime_user" ]; then
    runtime_user=ftbhost
    adduser -D -H -u "$HOST_UID" -G "$runtime_group" -s /bin/sh "$runtime_user"
else
    current_group=$(getent passwd "$HOST_UID" | cut -d: -f4)
    if [ "$current_group" != "$HOST_GID" ]; then
        sed -i -E "s/^(${runtime_user}:[^:]*:${HOST_UID}:)[0-9]+:/\1${HOST_GID}:/" /etc/passwd
    fi
fi

run_as_host() {
    su -s /bin/sh -p "$runtime_user" -c 'exec "$@"' -- sh "$@"
}

if [ "$#" -gt 0 ]; then
    exec su -s /bin/sh -p "$runtime_user" -c 'exec "$@"' -- sh "$@"
fi

lock_hash=$(sha256sum package-lock.json | cut -d ' ' -f 1)
marker="node_modules/.compose-lock-${lock_hash}"

if [ ! -x node_modules/.bin/vite ] || [ ! -f "$marker" ]; then
    attempts=0
    until run_as_host npm ci --prefer-offline --no-audit --no-fund; do
        attempts=$((attempts + 1))
        if [ "$attempts" -ge 5 ]; then
            echo "Unable to install npm dependencies after ${attempts} attempts" >&2
            exit 1
        fi
        sleep $((attempts * 5))
    done
    find node_modules -maxdepth 1 -name '.compose-lock-*' -delete
    run_as_host touch "$marker"
fi

exec su -s /bin/sh -p "$runtime_user" -c 'exec "$@"' -- sh npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
