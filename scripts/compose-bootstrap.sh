#!/bin/sh
# Deterministic one-shot bootstrap for the Compose stacks (dev and prod).
# Idempotent steps in a fixed order; any failure aborts the stack startup
# because services gate on this service completing successfully.
set -eu

APP_DIR="${APP_DIR:-/var/www/html}"
BOOTSTRAP_PRODUCTION="${BOOTSTRAP_PRODUCTION:-0}"

# True when the file defines a non-empty APP_KEY (first assignment wins,
# mirroring scripts/setup-utils.mjs hasApplicationKey).
application_key_present() {
  key_line=$(grep -m 1 -E '^[[:space:]]*(export[[:space:]]+)?APP_KEY[[:space:]]*=' "$1" || :)
  key_value=${key_line#*=}
  key_value=$(printf '%s' "$key_value" | tr -d '[:space:]')
  key_value=${key_value#\"}
  key_value=${key_value%\"}
  key_value=${key_value#\'}
  key_value=${key_value%\'}
  [ -n "$key_value" ]
}

cd "$APP_DIR"

# Dev installs dependencies; production runs with dependencies baked into the image.
if [ "$BOOTSTRAP_PRODUCTION" != "1" ]; then
  composer install
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

# Generate only when no key is injected via the environment and none exists
# in .env, so restarts never rotate an already-generated key.
if [ -z "${APP_KEY:-}" ] && ! application_key_present .env; then
  php artisan key:generate --force
fi

php artisan migrate --force

if [ "$BOOTSTRAP_PRODUCTION" = "1" ]; then
  php artisan optimize
fi
