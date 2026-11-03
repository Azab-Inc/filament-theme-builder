        const userTokenPattern = /^user\.(color|palette)\.([a-z][a-z0-9-]{0,31})(?:\.(50|100|200|300|400|500|600|700|800|900|950))?$/;
        const userTokenName = (name) => /^[a-z][a-z0-9-]{0,31}$/.test(name) && !paletteNames.includes(name);
        const userModePair = (pair) => exactKeys(pair, ['light'], ['dark']) && isHexColor(pair.light) && (pair.dark === undefined || isHexColor(pair.dark));
        const validUserTokens = (tokens) => {
            if (!exactKeys(tokens, ['colors', 'palettes']) || !isRecord(tokens.colors) || !isRecord(tokens.palettes)) return false;
            const names = [...Object.keys(tokens.colors), ...Object.keys(tokens.palettes)];
            if (names.length > 64 || new Set(names).size !== names.length || !names.every(userTokenName)) return false;
            if (!Object.values(tokens.colors).every(userModePair)) return false;
            return Object.values(tokens.palettes).every((palette) => exactKeys(palette, ['base', 'shades']) && userModePair(palette.base) && exactKeys(palette.shades, paletteShades.map(String)) && Object.values(palette.shades).every(userModePair));
        };
        const resolveUserToken = (value, tokens, mode) => {
            if (typeof value !== 'string' || !value.startsWith('user.')) return value;
            const match = userTokenPattern.exec(value);
            if (!match || !tokens || (match[1] === 'palette') !== Boolean(match[3])) return null;
            const collection = match[1] === 'color' ? tokens.colors : tokens.palettes;
            if (!Object.prototype.hasOwnProperty.call(collection, match[2])) return null;
            const pair = match[1] === 'color' ? collection[match[2]] : collection[match[2]].shades[match[3]];
            return pair?.[mode] ?? pair?.light ?? null;
        };
        const storedLinkValues = (theme, target) => {
            if (target.kind === 'raw') { const row = theme.rawOverrides.find((item) => item.selector === target.selector); return [row?.properties?.[target.property], row?.darkProperties?.[target.property]]; }
            if (target.kind === 'semantic') { const row = theme.overrides.find((item) => ['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId'].every((key) => item[key] === target[key])); return [row?.value, row?.darkValue]; }
            let pair;
            if (target.kind === 'foundation' && typeof target.path === 'string') { const [group, name] = target.path.split('.'); pair = theme.foundations[group]?.[name]; }
            if (target.kind === 'user-color') pair = theme.foundations.userTokens?.colors?.[target.name];
            if (target.kind === 'user-palette-base') pair = theme.foundations.userTokens?.palettes?.[target.name]?.base;
            if (target.kind === 'user-palette-shade') pair = theme.foundations.userTokens?.palettes?.[target.name]?.shades?.[target.shade];
            if (target.kind === 'palette-base') { const row = theme.foundations.palettes[target.name]; return [row?.base, row?.dark?.base]; }
            if (target.kind === 'palette-shade') { const row = theme.foundations.palettes[target.name]; return [row?.overrides?.[target.shade], row?.dark?.overrides?.[target.shade]]; }
            return [pair?.light, pair?.dark];
        };
        const validModeLinks = (links, theme) => { const seen = new Set(); return isRecord(links) && Object.keys(links).length <= 2048 && Object.entries(links).every(([key, link]) => {
            if (!isRecord(link) || !exactKeys(link, ['identity', 'value', 'linked'], ['target']) || link.identity !== key || key.length > 2048 || link.linked !== true || !['string', 'number', 'boolean'].includes(typeof link.value)) return false;
            const target = link.target ?? (key.startsWith('foundation.') ? { kind: 'foundation', path: key.slice('foundation.'.length) } : key.startsWith('user.color.') ? { kind: 'user-color', name: key.slice('user.color.'.length) } : null);
            if (!isRecord(target)) return false;
            const expectedIdentity = target.kind === 'foundation' ? `foundation.${target.path}` : target.kind === 'user-color' ? `user.color.${target.name}` : `target:${JSON.stringify(Object.fromEntries(Object.keys(target).sort().map((name) => [name, target[name]])))}`;
            const legacy = ['foundation', 'user-color'].includes(target.kind) ? expectedIdentity : `target:${JSON.stringify(target)}`;
            if ((key !== expectedIdentity && key !== legacy) || seen.has(expectedIdentity)) return false;
            seen.add(expectedIdentity);
            if (!storedLinkValues(theme, target).every((value) => value === link.value)) return false;
            if (target.kind === 'raw') return exactKeys(target, ['kind', 'selector', 'property']) && isSafeRawSelector(target.selector) && rawVisualProperties.includes(target.property) && isSafeRawPropertyValue(target.property, link.value, theme.foundations.userTokens);
            if (target.kind === 'foundation') return exactKeys(target, ['kind', 'path']) && /^(surfaces|borders|text)\.[a-z-]+$/.test(target.path) && isSafeExplicitPath(`${target.path}.light`);
            if (target.kind === 'user-color') return exactKeys(target, ['kind', 'name']) && Object.prototype.hasOwnProperty.call(theme.foundations.userTokens?.colors ?? {}, target.name);
            if (['palette-base', 'palette-shade', 'user-palette-base', 'user-palette-shade'].includes(target.kind)) {
                const shade = target.kind.endsWith('shade');
                const names = target.kind.startsWith('user-') ? Object.keys(theme.foundations.userTokens?.palettes ?? {}) : paletteNames;
                return exactKeys(target, ['kind', 'name', ...(shade ? ['shade'] : [])]) && names.includes(target.name) && (!shade || paletteShades.includes(target.shade));
            }
            if (target.kind === 'semantic') {
                const { kind, ...override } = target;
                const definition = controlDefinitions.get(`${override.targetId}\u0000${override.controlId}`);
                return Object.keys(override).every((key) => ['targetId', 'controlId', 'scope', 'componentId', 'variantId', 'stateId'].includes(key)) && definition && validateOverrideScope(override, definition);
            }
            return false;
        }); };
