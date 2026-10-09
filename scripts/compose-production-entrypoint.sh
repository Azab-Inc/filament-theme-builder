#!/bin/sh
set -eu

RUNTIME_DIR="${RUNTIME_DIR:-/runtime}"
app_key_env=$(printf '%s' "${APP_KEY:-}" | tr -d '[:space:]')
if [ -z "$app_key_env" ]; then
  unset APP_KEY
fi

if [ -f "$RUNTIME_DIR/APP_KEY" ] && [ -z "${APP_KEY:-}" ]; then
  runtime_key=$(cat "$RUNTIME_DIR/APP_KEY")
  if [ -n "$(printf '%s' "$runtime_key" | tr -d '[:space:]')" ]; then
    export APP_KEY="$runtime_key"
  fi
fi

exec "$@"
