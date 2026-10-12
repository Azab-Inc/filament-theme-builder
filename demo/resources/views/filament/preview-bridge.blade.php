<script id="ftb-preview-bridge">
    (() => {
        const configuredOrigins = @json(config('preview.allowed_origins'));
        const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : [window.location.origin];
        const paletteShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        const paletteNames = ['primary', 'success', 'warning', 'danger', 'info', 'gray'];
        const surfaceSelectors = {
            page: ['html', 'body'], sidebar: ['.fi-sidebar'], topbar: ['.fi-topbar'],
            card: ['.fi-section', '.fi-ta-ctn', '.fi-wi-stats-overview-stat'],
            elevated: ['.fi-modal', '.fi-dropdown'],
            input: ['.fi-input', '.fi-select-input', '.fi-fo-textarea'],
        };
        const borderSelectors = {
            default: ['.fi-section', '.fi-ta-ctn', '.fi-input', '.fi-select-input', '.fi-fo-textarea'],
            strong: ['.fi-btn.fi-outlined', '.fi-section-header', '.fi-ta-header'],
        };
        const textSelectors = {
            primary: ['body', '.fi-body', '.fi-in-text', '.fi-fo-field-label'],
            muted: ['.fi-section-header-description', '.fi-fo-field-label-help', '.fi-in-text-description'],
            disabled: [':disabled', '[disabled]', '.fi-disabled'],
        };
        const typographySelectors = {
            body: ['body', '.fi-body', '.fi-btn', '.fi-input', '.fi-select-input', '.fi-fo-textarea'],
            heading: ['h1', 'h2', 'h3', 'h4', '.fi-header-heading', '.fi-section-header-heading', '.fi-ta-header-heading'],
            mono: ['code', 'pre', '.fi-in-key-value'],
        };
        const spacingSelectors = {
            '0': ['.fi-sidebar'], px: ['.fi-topbar'], '0.5': ['.fi-btn'], '1': ['.fi-input', '.fi-select-input'],
            '1.5': ['.fi-section-header'], '2': ['.fi-section'], '3': ['.fi-ta-header'], '4': ['.fi-ta-ctn'],
            '6': ['.fi-modal'], '8': ['.fi-page'],
        };
        const componentSelectors = ['.fi-section', '.fi-ta', '.fi-ta-ctn', '.fi-btn', '.fi-input', '.fi-select-input', '.fi-fo-textarea', '.fi-modal'];
        const styleId = 'ftb-managed-theme';
        const safeToken = /^[a-z\d_.-]{1,100}$/i;
        const fontAllowlist = new Map([['Inter', 'Inter'], ['Roboto', 'Roboto']]);
        const controlDefinitions = new Map([
            ['button.primary\u0000background', { type: 'color', component: 'button', variants: ['primary', 'secondary'], states: ['default', 'hover'] }],
            ['button.secondary\u0000background', { type: 'color', component: 'button', variants: ['primary', 'secondary'], states: ['default', 'hover'] }],
            ['global.primary\u0000primary', { type: 'color', component: undefined, variants: [], states: [] }],
        ]);
        const overrideIdentities = new Set(controlDefinitions.keys());
        const safeColor = (value) => typeof value === 'string' && (/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value) || /^var\(--(?:primary|success|warning|danger|info|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)\)$/.test(value));
        const systemMonoFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';
        const safeFont = (value) => isRecord(value) && ['system', 'curated', 'custom'].includes(value.kind) && typeof value.name === 'string' && /^[A-Za-z0-9][A-Za-z0-9 .,_-]{0,99}$/.test(value.name) && typeof value.family === 'string' && (value.family === systemMonoFamily || /^[A-Za-z0-9][A-Za-z0-9 .,_-]*$/.test(value.family)) && (value.kind === 'curated' ? exactKeys(value, ['kind', 'name', 'family', 'provider']) && value.provider === 'google-fonts' && fontAllowlist.get(value.name) === value.family : exactKeys(value, ['kind', 'name', 'family']) && (value.kind !== 'custom' || value.name === value.family));
        const mapping = (id, property, selectors, variable) => ({ id, mapping: property === 'color' || property === 'fontFamily' ? 'preview-emulatable' : 'live-emulation', property, selectors, ...(variable ? { variable } : {}) });
        const canonicalFoundationMappings = new Map();
        for (const palette of paletteNames) {
            canonicalFoundationMappings.set(`palette.${palette}.base`, mapping(`palette.${palette}.base`, 'color', [`.fi-color-${palette}`, `.fi-btn.fi-color-${palette}`], `--ftb-${palette}`));
            for (const shade of paletteShades) canonicalFoundationMappings.set(`palette.${palette}.shades.${shade}`, mapping(`palette.${palette}.shades.${shade}`, 'color', [`.fi-color-${palette}`, `.fi-btn.fi-color-${palette}`], `--${palette}-${shade}`));
        }
        for (const [name, selectors] of Object.entries(surfaceSelectors)) canonicalFoundationMappings.set(`surface.${name}`, mapping(`surface.${name}`, 'color', selectors));
        for (const [name, selectors] of Object.entries(borderSelectors)) canonicalFoundationMappings.set(`border.${name}`, mapping(`border.${name}`, 'color', selectors));
        for (const [name, selectors] of Object.entries(textSelectors)) canonicalFoundationMappings.set(`text.${name}`, mapping(`text.${name}`, 'color', selectors));
        for (const [name, selectors] of Object.entries(typographySelectors)) canonicalFoundationMappings.set(`typography.${name}`, mapping(`typography.${name}`, 'fontFamily', selectors));
        for (const [name, selectors] of Object.entries(spacingSelectors)) canonicalFoundationMappings.set(`spacing.${name}`, mapping(`spacing.${name}`, 'spacing', selectors));
        for (const id of ['density', 'radius', 'borderWidth', 'shadow']) canonicalFoundationMappings.set(id, mapping(id, id === 'density' ? 'density' : id, componentSelectors));

        const foundationKeys = ['palettes', 'surfaces', 'borders', 'text', 'typography', 'spacing', 'density', 'radius', 'borderWidth', 'shadow'];
        const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
        const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
        const isFoundationRecord = (foundations) => {
            if (!exactKeys(foundations, foundationKeys) || !exactKeys(foundations.palettes, paletteNames) || !exactKeys(foundations.surfaces, Object.keys(surfaceSelectors)) || !exactKeys(foundations.borders, Object.keys(borderSelectors)) || !exactKeys(foundations.text, Object.keys(textSelectors)) || !exactKeys(foundations.typography, Object.keys(typographySelectors)) || !exactKeys(foundations.spacing, Object.keys(spacingSelectors))) return false;
            if (!['compact', 'default', 'spacious'].includes(foundations.density) || !['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(foundations.radius) || !['none', 'sm', 'md', 'lg', 'xl'].includes(foundations.shadow) || typeof foundations.borderWidth !== 'number' || !Number.isFinite(foundations.borderWidth) || foundations.borderWidth < 0 || foundations.borderWidth > 8) return false;
            for (const name of paletteNames) {
                const value = foundations.palettes[name];
                if (!exactKeys(value, ['base', 'shades', 'overrides']) || !/^#[\da-f]{6}$/i.test(value.base) || !exactKeys(value.shades, paletteShades.map(String)) || !isRecord(value.overrides)) return false;
                if (!paletteShades.every((shade) => /^#[\da-f]{6}$/i.test(value.shades[shade]) && (value.overrides[shade] === undefined || /^#[\da-f]{6}$/i.test(value.overrides[shade])))) return false;
                if (Object.keys(value.overrides).some((shade) => !paletteShades.includes(Number(shade)) || !/^#[\da-f]{6}$/i.test(value.overrides[shade]))) return false;
            }
            for (const collection of [foundations.surfaces, foundations.borders, foundations.text]) for (const value of Object.values(collection)) if (!exactKeys(value, ['light', 'dark']) || !safeColor(value.light) || !safeColor(value.dark)) return false;
            if (!Object.values(foundations.typography).every(safeFont)) return false;
            return Object.values(foundations.spacing).every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 256);
        };
        const sameArray = (left, right) => Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
        const isSafeToken = (value) => typeof value === 'string' && safeToken.test(value);
        const validateOverrideScope = (override, definition) => {
            const hasComponent = Object.prototype.hasOwnProperty.call(override, 'componentId');
            const hasVariant = Object.prototype.hasOwnProperty.call(override, 'variantId');
            const hasState = Object.prototype.hasOwnProperty.call(override, 'stateId');
            if (override.scope === 'global') return !hasComponent && !hasVariant && !hasState;
            if (override.scope === 'component') return hasComponent && !hasVariant && !hasState && override.componentId === definition.component;
            if (override.scope === 'variant') return hasComponent && hasVariant && !hasState && override.componentId === definition.component && definition.variants.includes(override.variantId);
            if (override.scope === 'state') return hasComponent && hasVariant && hasState && override.componentId === definition.component && definition.variants.includes(override.variantId) && definition.states.includes(override.stateId);
            return false;
        };
        const isValidOverrideValue = (value, definition) => definition.type === 'color' && typeof value === 'string' && /^#[\da-f]{6}$/i.test(value);
        const isSafeOverride = (override) => {
            if (!isRecord(override) || !isSafeToken(override.targetId) || !isSafeToken(override.controlId) || !['global', 'component', 'variant', 'state'].includes(override.scope) || Object.keys(override).some((key) => !['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId', 'value'].includes(key))) return false;
            const identity = `${override.targetId}\u0000${override.controlId}`;
            const definition = controlDefinitions.get(identity);
            return overrideIdentities.has(identity) && definition && validateOverrideScope(override, definition) && isValidOverrideValue(override.value, definition) && ['componentId', 'variantId', 'stateId'].every((key) => override[key] === undefined || isSafeToken(override[key]));
        };
        const isAcceptedProjection = (projection) => {
            if (!isRecord(projection) || projection.schemaVersion !== 1 || projection.compatibility !== 'filament-5.9' || !['light', 'dark'].includes(projection.mode) || !Array.isArray(projection.mappings) || projection.mappings.length !== canonicalFoundationMappings.size) return false;
            const ids = new Set();
            return projection.mappings.every((candidate) => {
                const expected = canonicalFoundationMappings.get(candidate?.id);
                if (!expected || ids.has(candidate.id) || !isRecord(candidate) || candidate.mapping !== expected.mapping || candidate.property !== expected.property || !sameArray(candidate.selectors, expected.selectors) || candidate.variable !== expected.variable || Object.keys(candidate).some((key) => !['id', 'mapping', 'property', 'selectors', 'variable', 'value'].includes(key))) return false;
                if (candidate.property === 'color' && !safeColor(candidate.value)) return false;
                if (candidate.property === 'fontFamily' && (typeof candidate.value !== 'string' || (candidate.value !== systemMonoFamily && !/^[A-Za-z0-9][A-Za-z0-9 .,_-]*$/.test(candidate.value)))) return false;
                if (candidate.property === 'spacing' && (typeof candidate.value !== 'number' || !Number.isFinite(candidate.value) || candidate.value < 0 || candidate.value > 256)) return false;
                if (candidate.property === 'density' && !['compact', 'default', 'spacious'].includes(candidate.value)) return false;
                if (candidate.property === 'radius' && !['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(candidate.value)) return false;
                if (candidate.property === 'shadow' && !['none', 'sm', 'md', 'lg', 'xl'].includes(candidate.value)) return false;
                if (candidate.property === 'borderWidth' && (typeof candidate.value !== 'number' || !Number.isFinite(candidate.value) || candidate.value < 0 || candidate.value > 8)) return false;
                ids.add(candidate.id);
                return true;
            });
        };
        const isAcceptedTheme = (message) => isRecord(message) && message.type === 'ftb:theme:update' && message.schemaVersion === 1 && isRecord(message.theme) && message.theme.schemaVersion === 3 && exactKeys(message.theme, ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss']) && exactKeys(message.theme.colors, ['primary']) && /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(message.theme.colors.primary) && isFoundationRecord(message.theme.foundations) && Array.isArray(message.theme.overrides) && message.theme.overrides.every(isSafeOverride) && new Set(message.theme.overrides.map((override) => [override.targetId, override.controlId, override.scope, override.componentId ?? '', override.variantId ?? '', override.stateId ?? ''].join('\u0000'))).size === message.theme.overrides.length && message.theme.customCss === '' && isAcceptedProjection(message.projection);
        const radiusValues = { none: '0px', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', xl: '0.75rem', full: '9999px' };
        const shadowValues = { none: 'none', sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)', md: '0 4px 6px -1px rgb(0 0 0 / 0.1)', lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)', xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)' };
        const cssValue = (value) => typeof value === 'number' ? `${value}px` : value;
        const updateTheme = (message) => {
            if (!isAcceptedTheme(message)) return false;
            const root = document.documentElement;
            root.classList.toggle('dark', message.projection.mode === 'dark');
            const rules = [`:root { color-scheme: ${message.projection.mode}; }`];
            for (const candidate of message.projection.mappings) {
                const selectors = candidate.selectors.join(',');
                if (candidate.variable) rules.push(`:root { ${candidate.variable}: ${candidate.value}; }`);
                if (!candidate.id.startsWith('palette.')) rules.push(`:root { --ftb-foundation-${candidate.id.replaceAll('.', '-')}: ${candidate.value}; }`);
                if (candidate.id.startsWith('palette.') && candidate.id.includes('.shades.')) rules.push(`${selectors} { ${candidate.variable}: ${candidate.value}; --ftb-${candidate.id.replaceAll('.', '-')}: var(${candidate.variable}); }`);
                else if (candidate.id.startsWith('palette.') && candidate.id.endsWith('.base')) rules.push(`${selectors} { --ftb-palette: var(${candidate.variable}); }`);
                else if (candidate.property === 'color') {
                    const property = candidate.id.startsWith('surface.') ? 'background-color' : candidate.id.startsWith('border.') ? 'border-color' : 'color';
                    rules.push(`${selectors} { ${property}: ${candidate.value}; }`);
                } else if (candidate.property === 'fontFamily') {
                    const family = candidate.value.includes(',') ? candidate.value : `"${candidate.value.replaceAll('"', '\\"')}"`;
                    rules.push(`${selectors} { font-family: ${family}; }`);
                }
                else if (candidate.property === 'spacing') rules.push(`${selectors} { padding-block: ${cssValue(candidate.value)}; }`);
                else if (candidate.property === 'density') {
                    const density = { compact: ['32px', '0.5rem'], default: ['40px', '0.75rem'], spacious: ['48px', '1rem'] }[candidate.value];
                    const table = '.fi-ta';
                    const row = { compact: '12px', default: '16px', spacious: '20px' }[candidate.value];
                    const headerCell = { compact: '10px', default: '14px', spacious: '18px' }[candidate.value];
                    rules.push(`${table} .fi-ta-header { padding-block: ${density[1]}; } ${table} .fi-ta-header-cell { padding-block: ${headerCell}; } ${table} .fi-ta-text, ${table} .fi-ta-icon, ${table} .fi-ta-image, ${table} .fi-ta-cell.fi-ta-selection-cell { padding-block: ${row}; }`);
                } else if (candidate.property === 'radius') rules.push(`${selectors} { border-radius: ${radiusValues[candidate.value]}; }`);
                else if (candidate.property === 'borderWidth') rules.push(`${selectors} { border-width: ${candidate.value}px; }`);
                else if (candidate.property === 'shadow') rules.push(`${selectors} { box-shadow: ${shadowValues[candidate.value]}; }`);
            }
            const style = document.getElementById(styleId) ?? document.createElement('style');
            style.id = styleId;
            style.textContent = rules.join('\n');
            document.head.append(style);
            window.dispatchEvent(new CustomEvent('ftb:theme:updated', { detail: message.theme }));
            return true;
        };
        window.addEventListener('message', (event) => {
            if (!allowedOrigins.includes(event.origin) || event.source !== window.parent) return;
            if (updateTheme(event.data)) window.dispatchEvent(new CustomEvent('ftb:preview-message-accepted'));
        });
    })();
</script>
