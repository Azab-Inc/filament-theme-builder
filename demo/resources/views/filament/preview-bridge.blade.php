<script id="ftb-preview-bridge">
    (() => {
        const configuredOrigins = @json(config('preview.allowed_origins'));
        const allowedOrigins = configuredOrigins.length > 0 ? configuredOrigins : [window.location.origin];
        const paletteShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        const paletteNames = ['primary', 'success', 'warning', 'danger', 'info', 'gray'];
        // Mirrored from builder/src/registry/tailwind-color-catalog.ts; parity is tested in the builder.
        const tailwindColorFamilies = ['red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'slate', 'gray', 'zinc', 'neutral', 'stone', 'mauve', 'olive', 'mist', 'taupe'];
        const tailwindColorShades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
        const tailwindColorValues = {
            red: ['oklch(97.1% .013 17.38)', 'oklch(93.6% .032 17.717)', 'oklch(88.5% .062 18.334)', 'oklch(80.8% .114 19.571)', 'oklch(70.4% .191 22.216)', 'oklch(63.7% .237 25.331)', 'oklch(57.7% .245 27.325)', 'oklch(50.5% .213 27.518)', 'oklch(44.4% .177 26.899)', 'oklch(39.6% .141 25.723)', 'oklch(25.8% .092 26.042)'],
            orange: ['oklch(98% .016 73.684)', 'oklch(95.4% .038 75.164)', 'oklch(90.1% .076 70.697)', 'oklch(83.7% .128 66.29)', 'oklch(75% .183 55.934)', 'oklch(70.5% .213 47.604)', 'oklch(64.6% .222 41.116)', 'oklch(55.3% .195 38.402)', 'oklch(47% .157 37.304)', 'oklch(40.8% .123 38.172)', 'oklch(26.6% .079 36.259)'],
            amber: ['oklch(98.7% .022 95.277)', 'oklch(96.2% .059 95.617)', 'oklch(92.4% .12 95.746)', 'oklch(87.9% .169 91.605)', 'oklch(82.8% .189 84.429)', 'oklch(76.9% .188 70.08)', 'oklch(66.6% .179 58.318)', 'oklch(55.5% .163 48.998)', 'oklch(47.3% .137 46.201)', 'oklch(41.4% .112 45.904)', 'oklch(27.9% .077 45.635)'],
            yellow: ['oklch(98.7% .026 102.212)', 'oklch(97.3% .071 103.193)', 'oklch(94.5% .129 101.54)', 'oklch(90.5% .182 98.111)', 'oklch(85.2% .199 91.936)', 'oklch(79.5% .184 86.047)', 'oklch(68.1% .162 75.834)', 'oklch(55.4% .135 66.442)', 'oklch(47.6% .114 61.907)', 'oklch(42.1% .095 57.708)', 'oklch(28.6% .066 53.813)'],
            lime: ['oklch(98.6% .031 120.757)', 'oklch(96.7% .067 122.328)', 'oklch(93.8% .127 124.321)', 'oklch(89.7% .196 126.665)', 'oklch(84.1% .238 128.85)', 'oklch(76.8% .233 130.85)', 'oklch(64.8% .2 131.684)', 'oklch(53.2% .157 131.589)', 'oklch(45.3% .124 130.933)', 'oklch(40.5% .101 131.063)', 'oklch(27.4% .072 132.109)'],
            green: ['oklch(98.2% .018 155.826)', 'oklch(96.2% .044 156.743)', 'oklch(92.5% .084 155.995)', 'oklch(87.1% .15 154.449)', 'oklch(79.2% .209 151.711)', 'oklch(72.3% .219 149.579)', 'oklch(62.7% .194 149.214)', 'oklch(52.7% .154 150.069)', 'oklch(44.8% .119 151.328)', 'oklch(39.3% .095 152.535)', 'oklch(26.6% .065 152.934)'],
            emerald: ['oklch(97.9% .021 166.113)', 'oklch(95% .052 163.051)', 'oklch(90.5% .093 164.15)', 'oklch(84.5% .143 164.978)', 'oklch(76.5% .177 163.223)', 'oklch(69.6% .17 162.48)', 'oklch(59.6% .145 163.225)', 'oklch(50.8% .118 165.612)', 'oklch(43.2% .095 166.913)', 'oklch(37.8% .077 168.94)', 'oklch(26.2% .051 172.552)'],
            teal: ['oklch(98.4% .014 180.72)', 'oklch(95.3% .051 180.801)', 'oklch(91% .096 180.426)', 'oklch(85.5% .138 181.071)', 'oklch(77.7% .152 181.912)', 'oklch(70.4% .14 182.503)', 'oklch(60% .118 184.704)', 'oklch(51.1% .096 186.391)', 'oklch(43.7% .078 188.216)', 'oklch(38.6% .063 188.416)', 'oklch(27.7% .046 192.524)'],
            cyan: ['oklch(98.4% .019 200.873)', 'oklch(95.6% .045 203.388)', 'oklch(91.7% .08 205.041)', 'oklch(86.5% .127 207.078)', 'oklch(78.9% .154 211.53)', 'oklch(71.5% .143 215.221)', 'oklch(60.9% .126 221.723)', 'oklch(52% .105 223.128)', 'oklch(45% .085 224.283)', 'oklch(39.8% .07 227.392)', 'oklch(30.2% .056 229.695)'],
            sky: ['oklch(97.7% .013 236.62)', 'oklch(95.1% .026 236.824)', 'oklch(90.1% .058 230.902)', 'oklch(82.8% .111 230.318)', 'oklch(74.6% .16 232.661)', 'oklch(68.5% .169 237.323)', 'oklch(58.8% .158 241.966)', 'oklch(50% .134 242.749)', 'oklch(44.3% .11 240.79)', 'oklch(39.1% .09 240.876)', 'oklch(29.3% .066 243.157)'],
            blue: ['oklch(97% .014 254.604)', 'oklch(93.2% .032 255.585)', 'oklch(88.2% .059 254.128)', 'oklch(80.9% .105 251.813)', 'oklch(70.7% .165 254.624)', 'oklch(62.3% .214 259.815)', 'oklch(54.6% .245 262.881)', 'oklch(48.8% .243 264.376)', 'oklch(42.4% .199 265.638)', 'oklch(37.9% .146 265.522)', 'oklch(28.2% .091 267.935)'],
            indigo: ['oklch(96.2% .018 272.314)', 'oklch(93% .034 272.788)', 'oklch(87% .065 274.039)', 'oklch(78.5% .115 274.713)', 'oklch(67.3% .182 276.935)', 'oklch(58.5% .233 277.117)', 'oklch(51.1% .262 276.966)', 'oklch(45.7% .24 277.023)', 'oklch(39.8% .195 277.366)', 'oklch(35.9% .144 278.697)', 'oklch(25.7% .09 281.288)'],
            violet: ['oklch(96.9% .016 293.756)', 'oklch(94.3% .029 294.588)', 'oklch(89.4% .057 293.283)', 'oklch(81.1% .111 293.571)', 'oklch(70.2% .183 293.541)', 'oklch(60.6% .25 292.717)', 'oklch(54.1% .281 293.009)', 'oklch(49.1% .27 292.581)', 'oklch(43.2% .232 292.759)', 'oklch(38% .189 293.745)', 'oklch(28.3% .141 291.089)'],
            purple: ['oklch(97.7% .014 308.299)', 'oklch(94.6% .033 307.174)', 'oklch(90.2% .063 306.703)', 'oklch(82.7% .119 306.383)', 'oklch(71.4% .203 305.504)', 'oklch(62.7% .265 303.9)', 'oklch(55.8% .288 302.321)', 'oklch(49.6% .265 301.924)', 'oklch(43.8% .218 303.724)', 'oklch(38.1% .176 304.987)', 'oklch(29.1% .149 302.717)'],
            fuchsia: ['oklch(97.7% .017 320.058)', 'oklch(95.2% .037 318.852)', 'oklch(90.3% .076 319.62)', 'oklch(83.3% .145 321.434)', 'oklch(74% .238 322.16)', 'oklch(66.7% .295 322.15)', 'oklch(59.1% .293 322.896)', 'oklch(51.8% .253 323.949)', 'oklch(45.2% .211 324.591)', 'oklch(40.1% .17 325.612)', 'oklch(29.3% .136 325.661)'],
            pink: ['oklch(97.1% .014 343.198)', 'oklch(94.8% .028 342.258)', 'oklch(89.9% .061 343.231)', 'oklch(82.3% .12 346.018)', 'oklch(71.8% .202 349.761)', 'oklch(65.6% .241 354.308)', 'oklch(59.2% .249 0.584)', 'oklch(52.5% .223 3.958)', 'oklch(45.9% .187 3.815)', 'oklch(40.8% .153 2.432)', 'oklch(28.4% .109 3.907)'],
            rose: ['oklch(96.9% .015 12.422)', 'oklch(94.1% .03 12.58)', 'oklch(89.2% .058 10.001)', 'oklch(81% .117 11.638)', 'oklch(71.2% .194 13.428)', 'oklch(64.5% .246 16.439)', 'oklch(58.6% .253 17.585)', 'oklch(51.4% .222 16.935)', 'oklch(45.5% .188 13.697)', 'oklch(41% .159 10.272)', 'oklch(27.1% .105 12.094)'],
            slate: ['oklch(98.4% .003 247.858)', 'oklch(96.8% .007 247.896)', 'oklch(92.9% .013 255.508)', 'oklch(86.9% .022 252.894)', 'oklch(70.4% .04 256.788)', 'oklch(55.4% .046 257.417)', 'oklch(44.6% .043 257.281)', 'oklch(37.2% .044 257.287)', 'oklch(27.9% .041 260.031)', 'oklch(20.8% .042 265.755)', 'oklch(12.9% .042 264.695)'],
            gray: ['oklch(98.5% .002 247.839)', 'oklch(96.7% .003 264.542)', 'oklch(92.8% .006 264.531)', 'oklch(87.2% .01 258.338)', 'oklch(70.7% .022 261.325)', 'oklch(55.1% .027 264.364)', 'oklch(44.6% .03 256.802)', 'oklch(37.3% .034 259.733)', 'oklch(27.8% .033 256.848)', 'oklch(21% .034 264.665)', 'oklch(13% .028 261.692)'],
            zinc: ['oklch(98.5% 0 0)', 'oklch(96.7% .001 286.375)', 'oklch(92% .004 286.32)', 'oklch(87.1% .006 286.286)', 'oklch(70.5% .015 286.067)', 'oklch(55.2% .016 285.938)', 'oklch(44.2% .017 285.786)', 'oklch(37% .013 285.805)', 'oklch(27.4% .006 286.033)', 'oklch(21% .006 285.885)', 'oklch(14.1% .005 285.823)'],
            neutral: ['oklch(98.5% 0 0)', 'oklch(97% 0 0)', 'oklch(92.2% 0 0)', 'oklch(87% 0 0)', 'oklch(70.8% 0 0)', 'oklch(55.6% 0 0)', 'oklch(43.9% 0 0)', 'oklch(37.1% 0 0)', 'oklch(26.9% 0 0)', 'oklch(20.5% 0 0)', 'oklch(14.5% 0 0)'],
            stone: ['oklch(98.5% .001 106.423)', 'oklch(97% .001 106.424)', 'oklch(92.3% .003 48.717)', 'oklch(86.9% .005 56.366)', 'oklch(70.9% .01 56.259)', 'oklch(55.3% .013 58.071)', 'oklch(44.4% .011 73.639)', 'oklch(37.4% .01 67.558)', 'oklch(26.8% .007 34.298)', 'oklch(21.6% .006 56.043)', 'oklch(14.7% .004 49.25)'],
            mauve: ['oklch(98.5% 0 0)', 'oklch(96% .003 325.6)', 'oklch(92.2% .005 325.62)', 'oklch(86.5% .012 325.68)', 'oklch(71.1% .019 323.02)', 'oklch(54.2% .034 322.5)', 'oklch(43.5% .029 321.78)', 'oklch(36.4% .029 323.89)', 'oklch(26.3% .024 320.12)', 'oklch(21.2% .019 322.12)', 'oklch(14.5% .008 326)'],
            olive: ['oklch(98.8% .003 106.5)', 'oklch(96.6% .005 106.5)', 'oklch(93% .007 106.5)', 'oklch(88% .011 106.6)', 'oklch(73.7% .021 106.9)', 'oklch(58% .031 107.3)', 'oklch(46.6% .025 107.3)', 'oklch(39.4% .023 107.4)', 'oklch(28.6% .016 107.4)', 'oklch(22.8% .013 107.4)', 'oklch(15.3% .006 107.1)'],
            mist: ['oklch(98.7% .002 197.1)', 'oklch(96.3% .002 197.1)', 'oklch(92.5% .005 214.3)', 'oklch(87.2% .007 219.6)', 'oklch(72.3% .014 214.4)', 'oklch(56% .021 213.5)', 'oklch(45% .017 213.2)', 'oklch(37.8% .015 216)', 'oklch(27.5% .011 216.9)', 'oklch(21.8% .008 223.9)', 'oklch(14.8% .004 228.8)'],
            taupe: ['oklch(98.6% .002 67.8)', 'oklch(96% .002 17.2)', 'oklch(92.2% .005 34.3)', 'oklch(86.8% .007 39.5)', 'oklch(71.4% .014 41.2)', 'oklch(54.7% .021 43.1)', 'oklch(43.8% .017 39.3)', 'oklch(36.7% .016 35.7)', 'oklch(26.8% .011 36.5)', 'oklch(21.4% .009 43.1)', 'oklch(14.7% .004 49.3)'],
        };
        const surfaceSelectors = {
            page: ['html', 'body'], sidebar: ['.fi-sidebar'], topbar: ['.fi-topbar'],
            card: ['.fi-section', '.fi-ta-ctn', '.fi-wi-stats-overview-stat'],
            elevated: ['.fi-modal-window', '.fi-dropdown'],
            input: ['.fi-input', '.fi-select-input', '.fi-fo-textarea'],
        };
        const borderSelectors = {
            default: ['.fi-section', '.fi-ta-ctn', '.fi-input', '.fi-select-input', '.fi-fo-textarea'],
            strong: ['.fi-btn.fi-outlined', '.fi-section', '.fi-ta-header'],
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
            '1.5': ['.fi-section'], '2': ['.fi-section > div'], '3': ['.fi-ta-header'], '4': ['.fi-ta-ctn'],
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
        const resolveColorReference = (value) => {
            if (typeof value !== 'string') return null;
            if (/^var\(--(?:primary|success|warning|danger|info|gray)-(?:50|100|200|300|400|500|600|700|800|900|950)\)$/.test(value)) return value;
            const match = /^var\(--(?:color-)?([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950)\)$/.exec(value);
            if (!match || !tailwindColorFamilies.includes(match[1]) || !tailwindColorShades.includes(Number(match[2]))) return null;
            const literal = tailwindColorValues[match[1]]?.[tailwindColorShades.indexOf(Number(match[2]))] ?? getComputedStyle(document.documentElement).getPropertyValue(`--color-${match[1]}-${match[2]}`).trim();
            return literal || null;
        };
        const safeColor = (value) => typeof value === 'string' && (/^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value) || resolveColorReference(value) !== null);
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

        const foundationKeys = ['palettes', 'surfaces', 'borders', 'text', 'typography', 'spacing', 'density', 'radius', 'borderWidth', 'shadow', 'explicitPaths', 'provenanceVersion'];
        const exactKeys = (value, keys) => value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every((key) => Object.prototype.hasOwnProperty.call(value, key));
        const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
        const isFoundationRecord = (foundations) => {
            if (!exactKeys(foundations, foundationKeys) || !exactKeys(foundations.palettes, paletteNames) || !exactKeys(foundations.surfaces, Object.keys(surfaceSelectors)) || !exactKeys(foundations.borders, Object.keys(borderSelectors)) || !exactKeys(foundations.text, Object.keys(textSelectors)) || !exactKeys(foundations.typography, Object.keys(typographySelectors)) || !exactKeys(foundations.spacing, Object.keys(spacingSelectors))) return false;
            if (!Array.isArray(foundations.explicitPaths) || new Set(foundations.explicitPaths).size !== foundations.explicitPaths.length || foundations.explicitPaths.some((path) => typeof path !== 'string' || !isSafeExplicitPath(path))) return false;
            if (foundations.provenanceVersion !== 1 || !['compact', 'default', 'spacious'].includes(foundations.density) || !['none', 'sm', 'md', 'lg', 'xl', 'full'].includes(foundations.radius) || !['none', 'sm', 'md', 'lg', 'xl'].includes(foundations.shadow) || typeof foundations.borderWidth !== 'number' || !Number.isFinite(foundations.borderWidth) || foundations.borderWidth < 0 || foundations.borderWidth > 8) return false;
            for (const name of paletteNames) {
                const value = foundations.palettes[name];
                if (!exactKeys(value, ['base', 'shades', 'overrides']) || !isHexColor(value.base) || !exactKeys(value.shades, paletteShades.map(String)) || !isRecord(value.overrides)) return false;
                if (!paletteShades.every((shade) => isHexColor(value.shades[shade]) && (value.overrides[shade] === undefined || isHexColor(value.overrides[shade])))) return false;
                if (Object.keys(value.overrides).some((shade) => !paletteShades.includes(Number(shade)) || !isHexColor(value.overrides[shade]))) return false;
            }
            if (foundations.explicitPaths.some((path) => {
                const match = /^palettes\.([^.]+)\.overrides\.(\d+)$/.exec(path);
                return match && !Object.prototype.hasOwnProperty.call(foundations.palettes[match[1]].overrides, match[2]);
            })) return false;
            for (const collection of [foundations.surfaces, foundations.borders, foundations.text]) for (const value of Object.values(collection)) if (!exactKeys(value, ['light', 'dark']) || !safeColor(value.light) || !safeColor(value.dark)) return false;
            if (!Object.values(foundations.typography).every(safeFont)) return false;
            return Object.values(foundations.spacing).every((value) => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 256);
        };
        const isSafeExplicitPath = (path) => /^(?:palettes\.(?:primary|success|warning|danger|info|gray)\.(?:base|overrides\.(?:50|100|200|300|400|500|600|700|800|900|950))|(?:surfaces\.(?:page|sidebar|topbar|card|elevated|input)|borders\.(?:default|strong)|text\.(?:primary|muted|disabled))\.(?:light|dark)|typography\.(?:body|heading|mono)|spacing\.(?:0|px|0\.5|1|1\.5|2|3|4|6|8)|density|radius|borderWidth|shadow)$/.test(path);
        const sameArray = (left, right) => Array.isArray(left) && left.length === right.length && left.every((value, index) => value === right[index]);
        const isHexColor = (value) => typeof value === 'string' && /^#[\da-f]{6}(?:[\da-f]{2})?$/i.test(value);
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
        const isValidOverrideValue = (value, definition) => definition.type === 'color' && isHexColor(value);
        const isSafeOverride = (override) => {
            if (!isRecord(override) || !isSafeToken(override.targetId) || !isSafeToken(override.controlId) || !['global', 'component', 'variant', 'state'].includes(override.scope) || Object.keys(override).some((key) => !['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId', 'value'].includes(key))) return false;
            const identity = `${override.targetId}\u0000${override.controlId}`;
            const definition = controlDefinitions.get(identity);
            return overrideIdentities.has(identity) && definition && validateOverrideScope(override, definition) && isValidOverrideValue(override.value, definition) && ['componentId', 'variantId', 'stateId'].every((key) => override[key] === undefined || isSafeToken(override[key]));
        };
        const isAcceptedProjection = (projection, foundations) => {
            if (!isRecord(projection) || projection.schemaVersion !== 1 || projection.compatibility !== 'filament-5.9' || !['light', 'dark'].includes(projection.mode) || !Array.isArray(projection.mappings)) return false;
            const ids = new Set();
            const validMappings = projection.mappings.every((candidate) => {
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
            if (!validMappings) return false;
            for (const palette of paletteNames) {
                const paletteIds = [...canonicalFoundationMappings.keys()].filter((id) => id.startsWith(`palette.${palette}.`));
                const included = paletteIds.filter((id) => ids.has(id)).length;
                if (included !== 0 && included !== paletteIds.length) return false;
            }
            return projectionMatchesCanonicalFoundation(projection, foundations);
        };
        const isAcceptedTheme = (message) => isRecord(message) && message.type === 'ftb:theme:update' && message.schemaVersion === 1 && ['light', 'dark'].includes(message.activeMode) && isRecord(message.projection) && message.activeMode === message.projection.mode && isRecord(message.theme) && message.theme.schemaVersion === 3 && exactKeys(message.theme, ['schemaVersion', 'colors', 'foundations', 'overrides', 'customCss']) && exactKeys(message.theme.colors, ['primary']) && /^[#\da-f]{7,9}$/i.test(message.theme.colors.primary) && message.theme.colors.primary === message.theme.foundations?.palettes?.primary?.base && isFoundationRecord(message.theme.foundations) && Array.isArray(message.theme.overrides) && message.theme.overrides.every(isSafeOverride) && new Set(message.theme.overrides.map((override) => [override.targetId, override.controlId, override.scope, override.componentId ?? '', override.variantId ?? '', override.stateId ?? ''].join('\u0000'))).size === message.theme.overrides.length && message.theme.customCss === '' && isAcceptedProjection(message.projection, message.theme.foundations);
        const projectionMatchesCanonicalFoundation = (projection, foundations) => {
            const expectedMappings = [...canonicalFoundationMappings.values()].filter((entry) => {
                const palette = /^palette\.([^.]+)\./.exec(entry.id)?.[1];
                if (palette) return foundations.explicitPaths.some((path) => path === `palettes.${palette}.base` || path.startsWith(`palettes.${palette}.overrides.`));
                const modePath = /^(surface|border|text)\.(.+)$/.exec(entry.id);
                if (modePath) return foundations.explicitPaths.includes(`${modePath[1] === 'surface' ? 'surfaces' : modePath[1] === 'border' ? 'borders' : 'text'}.${modePath[2]}.${projection.mode}`);
                return foundations.explicitPaths.includes(entry.id);
            }).map((entry) => ({ ...entry, value: foundationValue(foundations, entry.id, projection.mode) }));
            if (projection.mappings.length !== expectedMappings.length || expectedMappings.length > canonicalFoundationMappings.size) return false;
            return expectedMappings.every((expected) => projection.mappings.some((candidate) =>
                candidate.id === expected.id && candidate.mapping === expected.mapping && candidate.property === expected.property && sameArray(candidate.selectors, expected.selectors) && candidate.variable === expected.variable && candidate.value === expected.value,
            ));
        };
        const foundationValue = (foundations, id, mode) => {
            if (id === 'density' || id === 'radius' || id === 'borderWidth' || id === 'shadow') return foundations[id];
            const paletteBase = /^palette\.([^.]+)\.base$/.exec(id);
            if (paletteBase) return foundations.palettes[paletteBase[1]].base;
            const paletteShade = /^palette\.([^.]+)\.shades\.(\d+)$/.exec(id);
            if (paletteShade) {
                const palette = foundations.palettes[paletteShade[1]];
                return palette.overrides[paletteShade[2]] ?? palette.shades[paletteShade[2]] ?? palette.base;
            }
            const modeValue = /^(surface|border|text)\.(.+)$/.exec(id);
            if (modeValue) return foundations[modeValue[1] === 'surface' ? 'surfaces' : modeValue[1] === 'border' ? 'borders' : 'text'][modeValue[2]][mode];
            const typography = /^typography\.(body|heading|mono)$/.exec(id);
            if (typography) return foundations.typography[typography[1]].family;
            const spacing = /^spacing\.(.+)$/.exec(id);
            if (spacing) return foundations.spacing[spacing[1]];
            return undefined;
        };
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
                const runtimeValue = candidate.property === 'color' ? (resolveColorReference(candidate.value) ?? candidate.value) : candidate.value;
                if (candidate.variable) rules.push(`:root { ${candidate.variable}: ${runtimeValue}; }`);
                if (!candidate.id.startsWith('palette.')) rules.push(`:root { --ftb-foundation-${candidate.id.replaceAll('.', '-')}: ${runtimeValue}; }`);
                if (candidate.id.startsWith('palette.') && candidate.id.includes('.shades.')) rules.push(`${selectors} { ${candidate.variable}: ${runtimeValue}; --ftb-${candidate.id.replaceAll('.', '-')}: var(${candidate.variable}); }`);
                else if (candidate.id.startsWith('palette.') && candidate.id.endsWith('.base')) rules.push(`${selectors} { --ftb-palette: var(${candidate.variable}); }`);
                else if (candidate.property === 'color') {
                    const property = candidate.id.startsWith('surface.') ? 'background-color' : candidate.id.startsWith('border.') ? 'border-color' : 'color';
                    rules.push(`${selectors} { ${property}: ${runtimeValue}; }`);
                } else if (candidate.property === 'fontFamily') {
                    const family = candidate.value.includes(',') ? candidate.value : `"${candidate.value.replaceAll('"', '\\"')}"`;
                    rules.push(`${selectors} { font-family: ${family}; }`);
                }
                else if (candidate.property === 'spacing') rules.push(`${selectors} { padding-block: ${cssValue(candidate.value)} !important; }`);
                else if (candidate.property === 'density') {
                    const density = { compact: ['32px', '0.5rem'], default: ['40px', '0.75rem'], spacious: ['48px', '1rem'] }[candidate.value];
                    const table = '.fi-ta';
                    const row = { compact: '12px', default: '16px', spacious: '20px' }[candidate.value];
                    const headerCell = { compact: '10px', default: '14px', spacious: '18px' }[candidate.value];
                    rules.push(`${table} .fi-ta-header { padding-block: ${density[1]} !important; } ${table} .fi-ta-header-cell { padding-block: ${headerCell} !important; } ${table} .fi-ta-text, ${table} .fi-ta-icon, ${table} .fi-ta-image, ${table} .fi-ta-cell.fi-ta-selection-cell { padding-block: ${row} !important; }`);
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
