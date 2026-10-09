#!/bin/sh
# Deterministic one-shot bootstrap for the Compose stacks (dev and prod).
# Idempotent steps in a fixed order; any failure aborts the stack startup
# because services gate on this service completing successfully.
set -eu

APP_DIR="${APP_DIR:-/var/www/html}"
BOOTSTRAP_PRODUCTION="${BOOTSTRAP_PRODUCTION:-0}"

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

# Dev installs dependencies; production runs with dependencies baked into the image.
if [ "$BOOTSTRAP_PRODUCTION" != "1" ]; then
  composer install
fi

if [ ! -f .env ]; then
  cp .env.example .env
fi

# Generate only when no key is injected via the environment and none exists
# in .env, so restarts never rotate an already-generated key. Environment
# values are consumed raw by the framework (dotenv parsing only applies to
# the file), so only whitespace counts as an empty environment value.
app_key_env=$(printf '%s' "${APP_KEY:-}" | tr -d '[:space:]')
if [ -z "$app_key_env" ] && ! application_key_present .env; then
  php artisan key:generate --force
fi

php artisan migrate --force

if [ "$BOOTSTRAP_PRODUCTION" = "1" ]; then
  php artisan optimize
fi
