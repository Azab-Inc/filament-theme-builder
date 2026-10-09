#!/bin/sh
set -eu

if [ -f /runtime/APP_KEY ] && [ -z "${APP_KEY:-}" ]; then
  export APP_KEY="$(cat /runtime/APP_KEY)"
fi

exec "$@"
