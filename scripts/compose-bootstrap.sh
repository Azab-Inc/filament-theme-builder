#!/bin/sh
# Deterministic one-shot bootstrap for the Compose stacks (dev and prod).
# Idempotent steps in a fixed order; any failure aborts the stack startup
# because services gate on this service completing successfully.
set -eu

APP_DIR="${APP_DIR:-/var/www/html}"
BOOTSTRAP_PRODUCTION="${BOOTSTRAP_PRODUCTION:-0}"
RUNTIME_DIR="${RUNTIME_DIR:-/runtime}"

# True when a raw APP_KEY value is a real key. Inline comments, quotes and
# whitespace are removed first, matching how phpdotenv resolves .env values:
# `APP_KEY= # comment`, `APP_KEY=   ` and `APP_KEY=""` all count as empty,
# while `APP_KEY=base64:real # note` counts as present.
key_value_present() {
  value=${1%%#*}
  value=$(printf '%s' "$value" | tr -d '[:space:]')
  value=${value#\"}
  value=${value%\"}
  value=${value#\'}
  value=${value%\'}
  [ -n "$value" ]
}

# True when the file defines a non-empty APP_KEY (first assignment wins,
# mirroring scripts/setup-utils.mjs hasApplicationKey).
application_key_present() {
  key_line=$(grep -m 1 -E '^[[:space:]]*(export[[:space:]]+)?APP_KEY[[:space:]]*=' "$1" || :)
  key_value_present "${key_line#*=}"
}

cd "$APP_DIR"

# An injected blank value must not override the valid key stored in `.env`.
if ! key_value_present "${APP_KEY:-}"; then
  unset APP_KEY
fi

# Dev installs dependencies; production runs with dependencies baked into the image.
if [ "$BOOTSTRAP_PRODUCTION" != "1" ]; then
  composer install
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

# Persist a valid injected key for sibling services that load only `.env`.
if key_value_present "${APP_KEY:-}"; then
  awk -v key="$APP_KEY" '
    /^[[:space:]]*(export[[:space:]]+)?APP_KEY[[:space:]]*=/ {
      if (!replaced) { print "APP_KEY=" key; replaced=1 }
      next
    }
    { print }
    END { if (!replaced) print "APP_KEY=" key }
  ' .env > .env.compose-bootstrap && mv .env.compose-bootstrap .env
fi

# Generate only when no key is injected via the environment and none exists
# in .env, so restarts never rotate an already-generated key. Environment
# values are consumed raw by the framework (dotenv parsing only applies to
# the file), so only whitespace counts as an empty environment value.
if [ -z "${APP_KEY:-}" ] && ! application_key_present .env; then
  php artisan key:generate --force
fi

php artisan migrate --force

if [ "$BOOTSTRAP_PRODUCTION" = "1" ]; then
  php artisan optimize
fi

if [ -d "$RUNTIME_DIR" ]; then
  runtime_key="${APP_KEY:-}"
  if ! key_value_present "$runtime_key"; then
    key_line=$(grep -m 1 -E '^[[:space:]]*(export[[:space:]]+)?APP_KEY[[:space:]]*=' .env || :)
    runtime_key=${key_line#*=}
    runtime_key=${runtime_key%%#*}
    runtime_key=$(printf '%s' "$runtime_key" | tr -d '[:space:]')
    runtime_key=${runtime_key#\"}
    runtime_key=${runtime_key%\"}
    runtime_key=${runtime_key#\'}
    runtime_key=${runtime_key%\'}
  fi
  if key_value_present "$runtime_key"; then
    printf '%s' "$runtime_key" > "$RUNTIME_DIR/APP_KEY"
  fi
fi
