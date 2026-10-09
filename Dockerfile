FROM node:24-alpine AS builder-assets

WORKDIR /app
COPY builder/package.json builder/package-lock.json ./
RUN npm ci
COPY builder/ ./
RUN npm run build

FROM node:24-alpine AS demo-assets

WORKDIR /app
COPY demo/package.json demo/package-lock.json ./
RUN npm ci
COPY demo/ ./
RUN npm run build

FROM dunglas/frankenphp:1-php8.5 AS runtime

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
RUN install-php-extensions intl pcntl pdo_sqlite zip

WORKDIR /var/www/html

COPY demo/composer.json demo/composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-progress --no-scripts

COPY demo/ ./
RUN composer dump-autoload --no-dev --optimize --no-interaction
COPY --from=demo-assets /app/public/build ./public/build
COPY --from=builder-assets /app/dist ./builder-dist
COPY demo/Caddyfile /etc/caddy/Caddyfile
COPY scripts/compose-bootstrap.sh /usr/local/bin/compose-bootstrap.sh
COPY scripts/compose-production-entrypoint.sh /usr/local/bin/compose-production-entrypoint.sh

RUN cp vendor/laravel/octane/src/Commands/stubs/frankenphp-worker.php public/frankenphp-worker.php \
    && chmod +x /usr/local/bin/compose-bootstrap.sh /usr/local/bin/compose-production-entrypoint.sh \
    && mkdir -p storage/app/private storage/app/public storage/framework/cache storage/framework/sessions storage/framework/views storage/logs

ENV APP_ENV=production \
    APP_DEBUG=false \
    SERVER_NAME=:80

ENTRYPOINT ["/usr/local/bin/compose-production-entrypoint.sh"]
CMD ["php", "artisan", "octane:frankenphp", "--host=0.0.0.0", "--port=80", "--workers=2", "--max-requests=500", "--caddyfile=/etc/caddy/Caddyfile"]
