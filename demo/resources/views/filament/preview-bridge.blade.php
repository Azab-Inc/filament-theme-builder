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
        const paletteNames = ['primary', 'success', 'warning', 'danger', 'info', 'gray'];
        const surfaceNames = ['page', 'sidebar', 'topbar', 'card', 'elevated', 'input'];
        const borderNames = ['default', 'strong'];
        const textNames = ['primary', 'muted', 'disabled'];
        const spacingNames = ['0', 'px', '0.5', '1', '1.5', '2', '3', '4', '6', '8'];
        const fontAllowlist = new Map([
            ['Inter', 'Inter'],
            ['Roboto', 'Roboto'],
        ]);
        const systemMonoFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
        const overrideIdentities = new Set([
            'button.primary\u0000background',
            'button.secondary\u0000background',
            'global.primary\u0000primary',
        ]);
        const previewMappingTuples = new Map([
            ['palette.primary.base', '--ftb-primary'],
            ...palette.map((shade) => [`palette.primary.shades.${shade}`, `--primary-${shade}`]),
        ]);
        const inventoryMappings = new Map([
            ...Array.from(previewMappingTuples.keys()).map((id) => [id, 'preview-emulatable']),
            ['global.primary', 'export-only'],
            ['button.primary', 'export-only'],
            ['button.secondary', 'export-only'],
            ['badge', 'export-only'],
            ['logo.light', 'export-only'],
            ['logo.dark', 'export-only'],
            ['density', 'unmapped'],
            ['surface.page', 'unmapped'],
        ]);
        for (const name of paletteNames) {
            inventoryMappings.set(`palette.${name}.base`, name === 'primary' ? 'preview-emulatable' : 'export-only');
            for (const shade of palette) inventoryMappings.set(`palette.${name}.shades.${shade}`, name === 'primary' ? 'preview-emulatable' : 'export-only');
        }
        for (const name of surfaceNames) inventoryMappings.set(`surface.${name}`, 'unmapped');
        for (const name of borderNames) inventoryMappings.set(`border.${name}`, 'export-only');
        for (const name of textNames) inventoryMappings.set(`text.${name}`, 'export-only');
        for (const name of ['body', 'heading', 'mono']) inventoryMappings.set(`typography.${name}`, 'runtime-refresh-required');
        for (const name of spacingNames) inventoryMappings.set(`spacing.${name}`, 'unmapped');
        for (const name of ['density', 'radius', 'borderWidth', 'shadow']) inventoryMappings.set(name, 'unmapped');
        const previewVariables = new Set(previewMappingTuples.values());

        function isRecord(value) {
            return value !== null && typeof value === 'object' && !Array.isArray(value);
        }

        function isSafeToken(value) {
            return typeof value === 'string' && safeToken.test(value);
        }

        function exactKeys(value, required) {
            return isRecord(value) && Object.keys(value).length === required.length &&
                required.every((key) => Object.prototype.hasOwnProperty.call(value, key));
        }

        function isHex(value) {
            return typeof value === 'string' && /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value);
        }

        function isFoundationColor(value) {
            return isHex(value) || (typeof value === 'string' && /^var\(--(?:primary|success|warning|danger|info|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)\)$/.test(value));
        }

        function isFiniteNumber(value) {
            return typeof value === 'number' && Number.isFinite(value);
        }

        function isSafeFont(value) {
            if (!isRecord(value) || !['system', 'curated', 'custom'].includes(value.kind) ||
                typeof value.name !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9 .,_-]{0,99}$/.test(value.name) || typeof value.family !== 'string' ||
                (value.family !== systemMonoFamily && !/^[A-Za-z0-9][A-Za-z0-9 .,_-]*$/.test(value.family))) return false;
            if (value.kind === 'curated') return exactKeys(value, ['kind', 'name', 'family', 'provider']) &&
                value.provider === 'google-fonts' && fontAllowlist.get(value.name) === value.family;
            return exactKeys(value, ['kind', 'name', 'family']) && (value.kind !== 'custom' || value.name === value.family);
        }

        function isFoundationRecord(foundations) {
            if (!exactKeys(foundations, [...foundationKeys])) return false;
            if (!exactKeys(foundations.palettes, paletteNames) ||
                !exactKeys(foundations.surfaces, surfaceNames) ||
                !exactKeys(foundations.borders, borderNames) ||
                !exactKeys(foundations.text, textNames) ||
                !exactKeys(foundations.typography, ['body', 'heading', 'mono']) ||
                !exactKeys(foundations.spacing, spacingNames) ||
                !['compact', 'default', 'spacious'].includes(foundations.density) ||
                !['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(foundations.radius) ||
                !['none', 'sm', 'md', 'lg', 'xl'].includes(foundations.shadow) ||
                !isFiniteNumber(foundations.borderWidth) || foundations.borderWidth < 0 || foundations.borderWidth > 8) return false;
            for (const name of paletteNames) {
                const paletteState = foundations.palettes[name];
                if (!exactKeys(paletteState, ['base', 'shades', 'overrides']) || !isHex(paletteState.base) ||
                    !exactKeys(paletteState.shades, palette.map(String)) || !isRecord(paletteState.overrides)) return false;
                for (const shade of palette) {
                    if (!isHex(paletteState.shades[shade]) || (paletteState.overrides[shade] !== undefined && !isHex(paletteState.overrides[shade]))) return false;
                }
                if (Object.keys(paletteState.overrides).some((shade) => !palette.includes(Number(shade)) || !isHex(paletteState.overrides[shade]))) return false;
            }
            for (const collection of [foundations.surfaces, foundations.borders, foundations.text]) {
                for (const value of Object.values(collection)) {
                    if (!exactKeys(value, ['light', 'dark']) || !isFoundationColor(value.light) || !isFoundationColor(value.dark)) return false;
                }
            }
            if (!Object.values(foundations.typography).every(isSafeFont)) return false;
            return Object.values(foundations.spacing).every((value) => isFiniteNumber(value) && value >= 0 && value <= 256);
        }

        function isSafeOverride(override) {
            if (!isRecord(override) || !isSafeToken(override.targetId) ||
                !isSafeToken(override.controlId) || typeof override.scope !== 'string' ||
                !['global', 'component', 'variant', 'state'].includes(override.scope) ||
                (typeof override.value === 'number' && !Number.isFinite(override.value)) ||
                !['string', 'number', 'boolean'].includes(typeof override.value)) {
                return false;
            }

            if (Object.keys(override).some((key) => !['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId', 'value'].includes(key))) return false;
            if (!overrideIdentities.has(`${override.targetId}\u0000${override.controlId}`)) return false;

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
                    inventoryMappings.get(mapping.id) !== mapping.mapping ||
                    !['string', 'number'].includes(typeof mapping.value) ||
                    (typeof mapping.value === 'number' && !Number.isFinite(mapping.value)) ||
                    (typeof mapping.value === 'string' && (/url\s*\(|@import|<|>|[\u0000-\u001f]/i.test(mapping.value))) ||
                    Object.keys(mapping).some((key) => !['id', 'mapping', 'variable', 'value'].includes(key))) {
                    return false;
                }
                if (mapping.mapping === 'preview-emulatable' &&
                    (previewMappingTuples.get(mapping.id) !== mapping.variable ||
                    typeof mapping.variable !== 'string' || !previewVariables.has(mapping.variable) ||
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
                    !isFoundationRecord(message.theme.foundations) || !Array.isArray(message.theme.overrides) ||
                    !message.theme.overrides.every(isSafeOverride) || new Set(message.theme.overrides.map((override) => [override.targetId, override.controlId, override.scope, override.componentId ?? '', override.variantId ?? '', override.stateId ?? ''].join('\u0000'))).size !== message.theme.overrides.length ||
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
                        detail: { compatibility: message.projection.compatibility, mode: message.projection.mode, unmapped },
                    }));
                }

                const mappings = message.projection.mappings.filter((mapping) => mapping.mapping === 'preview-emulatable');
                if (mappings.length === 0) return true;
                const style = document.getElementById(styleId) ?? document.createElement('style');
                style.id = styleId;
                style.textContent = `:root { color-scheme: ${message.projection.mode}; ${mappings.map((mapping) => `${mapping.variable}: ${mapping.value};`).join(' ')} }`;
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
