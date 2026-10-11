<script id="ftb-preview-bridge">
    (() => {
        const configuredOrigins = @json(config('preview.allowed_origins'));
        const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : [window.location.origin];
        const palette = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        const styleId = 'ftb-managed-theme';
        const safeToken = /^[a-z\d_.-]{1,100}$/i;
        const foundationKeys = new Set([
            'palettes', 'surfaces', 'borders', 'text', 'typography',
            'spacing', 'density', 'radius', 'borderWidth', 'shadow',
        ]);
        const previewVariables = new Set([
            '--ftb-primary',
            ...palette.map((shade) => `--primary-${shade}`),
        ]);

        function isRecord(value) {
            return value !== null && typeof value === 'object' && !Array.isArray(value);
        }

        function isSafeToken(value) {
            return typeof value === 'string' && safeToken.test(value);
        }

        function isSafeOverride(override) {
            if (!isRecord(override) || !isSafeToken(override.targetId) ||
                !isSafeToken(override.controlId) || typeof override.scope !== 'string' ||
                !['global', 'component', 'variant', 'state'].includes(override.scope) ||
                (typeof override.value === 'number' && !Number.isFinite(override.value)) ||
                !['string', 'number', 'boolean'].includes(typeof override.value)) {
                return false;
            }

            return ['componentId', 'variantId', 'stateId'].every((key) =>
                override[key] === undefined || isSafeToken(override[key]),
            );
        }

        function isAcceptedProjection(projection) {
            if (!isRecord(projection) || projection.schemaVersion !== 1 ||
                projection.compatibility !== 'filament-5.9' ||
                !['light', 'dark'].includes(projection.mode) || !Array.isArray(projection.mappings)) {
                return false;
            }

            const ids = new Set();
            return projection.mappings.every((mapping) => {
                if (!isRecord(mapping) || !isSafeToken(mapping.id) || ids.has(mapping.id) ||
                    !['preview-emulatable', 'runtime-refresh-required', 'export-only', 'unmapped'].includes(mapping.mapping) ||
                    !['string', 'number'].includes(typeof mapping.value) ||
                    (typeof mapping.value === 'number' && !Number.isFinite(mapping.value)) ||
                    (typeof mapping.value === 'string' && (/url\s*\(|@import|<|>|[\u0000-\u001f]/i.test(mapping.value))) ||
                    Object.keys(mapping).some((key) => !['id', 'mapping', 'variable', 'value'].includes(key))) {
                    return false;
                }
                if (mapping.mapping === 'preview-emulatable' &&
                    (typeof mapping.variable !== 'string' || !previewVariables.has(mapping.variable) ||
                    typeof mapping.value !== 'string' || !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(mapping.value))) {
                    return false;
                }
                if (mapping.mapping !== 'preview-emulatable' && mapping.variable !== undefined) return false;
                ids.add(mapping.id);
                return true;
            });
        }

        function hasOnlyFoundationKeys(foundations) {
            return isRecord(foundations) && Object.keys(foundations).every((key) => foundationKeys.has(key));
        }

        function hasOnlyKeys(value, keys) {
            return isRecord(value) && Object.keys(value).every((key) => keys.includes(key));
        }

        function isAcceptedTheme(message) {
            if (!isRecord(message) || message.type !== 'ftb:theme:update' || message.schemaVersion !== 1 ||
                !isRecord(message.theme) || ![1, 2].includes(message.theme.schemaVersion) ||
                !isRecord(message.theme.colors) || typeof message.theme.colors.primary !== 'string' ||
                !/^#[\da-f]{6}$/i.test(message.theme.colors.primary)) {
                if (!isRecord(message) || message.type !== 'ftb:theme:update' || message.schemaVersion !== 1 ||
                    !isRecord(message.theme) || message.theme.schemaVersion !== 3 ||
                    !hasOnlyKeys(message.theme, ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss']) ||
                    !hasOnlyKeys(message.theme.colors, ['primary']) ||
                    !isRecord(message.theme.colors) || !/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(message.theme.colors.primary) ||
                    !hasOnlyFoundationKeys(message.theme.foundations) || !Array.isArray(message.theme.overrides) ||
                    !message.theme.overrides.every(isSafeOverride) ||
                    message.theme.customCss !== '' || !isAcceptedProjection(message.projection)) {
                    return false;
                }
                return true;
            }

            return message.theme.schemaVersion === 1 ||
                (Array.isArray(message.theme.overrides) && message.theme.overrides.every(isSafeOverride));
        }

        function updateTheme(message) {
            if (!isAcceptedTheme(message)) {
                return false;
            }

            if (message.theme.schemaVersion === 3) {
                const unmapped = message.projection.mappings
                    .filter((mapping) => mapping.mapping !== 'preview-emulatable')
                    .map((mapping) => mapping.id);
                if (unmapped.length > 0) {
                    window.dispatchEvent(new CustomEvent('ftb:preview-compatibility', {
                        detail: { compatibility: message.projection.compatibility, unmapped },
                    }));
                }

                const mappings = message.projection.mappings.filter((mapping) => mapping.mapping === 'preview-emulatable');
                if (mappings.length === 0) return true;
                const style = document.getElementById(styleId) ?? document.createElement('style');
                style.id = styleId;
                style.textContent = `:root { ${mappings.map((mapping) => `${mapping.variable}: ${mapping.value};`).join(' ')} }`;
                document.head.append(style);
                window.dispatchEvent(new CustomEvent('ftb:theme:updated', { detail: message.theme }));
                return true;
            }

            const hex = message.theme.colors.primary;
            const channels = hex.slice(1).match(/.{2}/g).map((channel) => parseInt(channel, 16));
            const style = document.getElementById(styleId) ?? document.createElement('style');
            style.id = styleId;
            style.textContent = `:root { --ftb-primary: ${hex}; ${palette.map((shade, index) => {
                const base = Math.round(255 * (10 - index) / 10);
                const rgb = channels.map((channel) => Math.round(channel * index / 10 + base));
                return `--primary-${shade}: rgb(${rgb.join(' ')});`;
            }).join(' ')} }`;
            document.head.append(style);
            window.dispatchEvent(new CustomEvent('ftb:theme:updated', { detail: message.theme }));
            return true;
        }

    window.addEventListener('message', (event) => {
        if (!allowedOrigins.includes(event.origin) || event.source !== window.parent) {
            return;
        }

        if (updateTheme(event.data)) {
            window.dispatchEvent(new CustomEvent('ftb:preview-message-accepted'));
        }
    });
    })();
</script>
