import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { PALETTE_NAMES, PALETTE_SHADES, type FoundationState } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/services/foundation-defaults'
import { validateFoundationMapping, validateFoundationState } from '@/services/foundation-validation'
import { TAILWIND_COLOR_FAMILIES, TAILWIND_COLOR_SHADES } from '@/registry/tailwind-color-catalog'

function validState(): FoundationState {
  return createDefaultFoundationState()
}

function expectError(value: unknown, code: string, path: string): void {
  const result = validateFoundationState(value)

  expect(result).toMatchObject({ valid: false, code, path })
}

describe('validateFoundationState', () => {
  it('accepts the typed default foundation state', () => {
    expect(validateFoundationState(validState())).toMatchObject({ valid: true })
    expect(validState().explicitPaths).toEqual([])
  })

  it('accepts a complete versioned V3 payload with canonical nested records', () => {
    const state = validState()

    expect(validateFoundationState({
      schemaVersion: 3,
      colors: { primary: state.palettes.primary.base },
      foundations: state,
      overrides: [],
      customCss: '',
    })).toMatchObject({ valid: true })
  })

  it('rejects a V3 payload when any required foundation record is missing', () => {
    const state = validState()
    const { surfaces: _surfaces, ...missingSurfaces } = state

    expectError({
      schemaVersion: 3,
      colors: { primary: state.palettes.primary.base },
      foundations: missingSurfaces,
      overrides: [],
      customCss: '',
    }, 'invalid-value', 'foundations.surfaces')
  })

  it('accepts an explicit provenance path when it is canonical', () => {
    expect(validateFoundationState({ ...validState(), explicitPaths: ['surfaces.page.light'] })).toMatchObject({ valid: true })
    expectError({ ...validState(), explicitPaths: ['surfaces.page.injected'] }, 'invalid-value', 'explicitPaths')
  })

  it('rejects duplicate explicit provenance paths', () => {
    expectError({ ...validState(), explicitPaths: ['density', 'density'] }, 'invalid-value', 'explicitPaths')
  })

  it.each([
    ['palettes.primary.overrides.500', (state: FoundationState) => ({ ...state, explicitPaths: ['palettes.primary.overrides.500'] })],
  ])('rejects provenance for absent palette value %s', (_path, makeInvalid) => {
    expectError(makeInvalid(validState()), 'invalid-value', 'explicitPaths')
  })

  it('keeps the bridge explicit-path allowlist in parity with the TypeScript validator', () => {
    const bridge = readFileSync(resolve(process.cwd(), '../demo/resources/views/filament/preview-bridge.blade.php'), 'utf8')
    const bridgeAllowlist = bridge.match(/const isSafeExplicitPath = \(path\) => (\/.*\/\.test\(path\));/)?.[1]
    expect(bridgeAllowlist).toBeDefined()
    const isBridgePathAllowed = new Function('path', `return ${bridgeAllowlist}`) as (path: string) => boolean
    const state = validState()
    const allowedPaths = [
      ...PALETTE_NAMES.flatMap((name) => [`palettes.${name}.base`, ...PALETTE_SHADES.map((shade) => `palettes.${name}.overrides.${shade}`)]),
      ...['surfaces.page', 'surfaces.sidebar', 'surfaces.topbar', 'surfaces.card', 'surfaces.elevated', 'surfaces.input', 'borders.default', 'borders.strong', 'text.primary', 'text.muted', 'text.disabled'].flatMap((path) => [`${path}.light`, `${path}.dark`]),
      ...['body', 'heading', 'mono'].map((name) => `typography.${name}`),
      ...Object.keys(state.spacing).map((key) => `spacing.${key}`),
      'density', 'radius', 'borderWidth', 'shadow',
    ]
    const paths = [...allowedPaths, 'palettes.primary.overrides.49', 'spacing.9', 'untrusted.path']

    for (const path of paths) {
      expect(isBridgePathAllowed(path), `bridge allowlist for ${path}`).toBe(allowedPaths.includes(path))
    }
  })

  it.each([
    ['palettes.unknown', (state: FoundationState) => ({ ...state, palettes: { ...state.palettes, unknown: state.palettes.primary } })],
    ['palettes.primary.shades.25', (state: FoundationState) => ({ ...state, palettes: { ...state.palettes, primary: { ...state.palettes.primary, shades: { ...state.palettes.primary.shades, 25: '#123456' } } } })],
    ['surfaces.unknown', (state: FoundationState) => ({ ...state, surfaces: { ...state.surfaces, unknown: { light: '#fff', dark: '#000' } } })],
    ['typography.unknown', (state: FoundationState) => ({ ...state, typography: { ...state.typography, unknown: state.typography.body } })],
    ['spacing.unknown', (state: FoundationState) => ({ ...state, spacing: { ...state.spacing, unknown: 1 } })],
  ])('rejects unknown key at %s', (_path, makeInvalid) => {
    expectError(makeInvalid(validState()), 'unknown-key', _path)
  })

  it.each([
    ['palettes.primary.base', (state: FoundationState) => ({ ...state, palettes: { ...state.palettes, primary: { ...state.palettes.primary, base: 'red' } } })],
    ['surfaces.page.light', (state: FoundationState) => ({ ...state, surfaces: { ...state.surfaces, page: { ...state.surfaces.page, light: '#12' } } })],
    ['borders.default.dark', (state: FoundationState) => ({ ...state, borders: { ...state.borders, default: { ...state.borders.default, dark: 'rgb(1, 2, 3)' } } })],
    ['surfaces.page.light', (state: FoundationState) => ({ ...state, surfaces: { ...state.surfaces, page: { ...state.surfaces.page, light: 'var(--unknown-200)' } } })],
  ])('rejects malformed colors at %s', (path, makeInvalid) => {
    expectError(makeInvalid(validState()), 'invalid-value', path)
  })

  it.each([
    'var(--red-200)',
    'var(--color-red-200)',
    'var(--sky-950)',
    'var(--color-sky-950)',
  ])('accepts an installed Tailwind v4 color reference %s', (reference) => {
    const state = validState()
    state.surfaces.sidebar.light = reference

    expect(validateFoundationState(state)).toMatchObject({ valid: true })
  })

  it('keeps the fixed Tailwind catalog aligned with the installed v4 theme source', () => {
    const themeSource = readFileSync(resolve(process.cwd(), '../demo/node_modules/tailwindcss/theme.css'), 'utf8')
    const names = [...themeSource.matchAll(/--color-([a-z]+)-(50|100|200|300|400|500|600|700|800|900|950):/g)]
      .map(([, family]) => family)
    const families = [...new Set(names)]

    expect(TAILWIND_COLOR_FAMILIES).toEqual(families)
    expect(TAILWIND_COLOR_SHADES).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
  })

  it.each([
    ['typography.body.family', 'url(https://example.test/font.woff2)'],
    ['typography.heading.family', '"Inter", sans-serif'],
    ['typography.mono.family', '@import url(font.css)'],
    ['typography.body.family', 'Inter\u0000Sans'],
  ])('rejects unsafe font family at %s', (path, family) => {
    const state = validState()
    const [, font] = path.split('.')
    state.typography[font as 'body' | 'heading' | 'mono'] = { ...state.typography[font as 'body' | 'heading' | 'mono'], family }

    expectError(state, 'unsafe-font', path)
  })

  it.each([
    ['spacing.4', (state: FoundationState) => ({ ...state, spacing: { ...state.spacing, 4: Number.NaN } })],
    ['spacing.6', (state: FoundationState) => ({ ...state, spacing: { ...state.spacing, 6: Number.POSITIVE_INFINITY } })],
    ['borderWidth', (state: FoundationState) => ({ ...state, borderWidth: Number.NEGATIVE_INFINITY })],
  ])('rejects non-finite number at %s', (path, makeInvalid) => {
    expectError(makeInvalid(validState()), 'invalid-value', path)
  })

  it('rejects duplicate override identities in a versioned foundation payload', () => {
    const state = validState()
    expectError({
      schemaVersion: 3,
      colors: { primary: '#6366f1' },
      foundations: state,
      customCss: '',
      overrides: [
        { targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#123456' },
        { targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#654321' },
      ],
    }, 'duplicate-override', 'overrides[1]')
  })

  it.each([
    ['overrides[0].targetId', { targetId: 12 }],
    ['overrides[0].scope', { scope: 'invalid' }],
    ['overrides[0].value', { value: { unsafe: true } }],
    ['overrides[0].componentId', { componentId: 12 }],
  ])('rejects malformed override field at %s', (path, change) => {
    const state = validState()
    const override = { targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#123456', ...change }

    expectError({
      schemaVersion: 3,
      colors: { primary: '#6366f1' },
      foundations: state,
      customCss: '',
      overrides: [override],
    }, 'invalid-value', path)
  })

  it.each(['<style>body{color:red}</style>', '<script>alert(1)</script>', 'url(https://example.test)', '@import url(font.css)', 'body { color: red; }'])('rejects unsafe custom CSS %s', (customCss) => {
    const state = validState()

    expectError({ schemaVersion: 3, colors: { primary: '#6366f1' }, foundations: state, customCss, overrides: [] }, 'invalid-value', 'customCss')
  })

  it('rejects missing required foundation sections and fixed-spacing violations', () => {
    const state = validState()
    const { text: _text, ...missingText } = state
    expectError(missingText, 'invalid-value', 'text')
    expectError({ ...state, spacing: { ...state.spacing, '9': 36 } }, 'unknown-key', 'spacing.9')
    expectError({ ...state, spacing: { ...state.spacing, '4': -1 } }, 'invalid-value', 'spacing.4')
    expectError({ ...state, spacing: { ...state.spacing, '4': 257 } }, 'invalid-value', 'spacing.4')
  })

  it('rejects unsupported mapping identifiers without coercing them', () => {
    expect(validateFoundationMapping('mapping.does-not-exist', validState())).toMatchObject({ valid: false, code: 'unsupported-mapping', path: 'mapping' })
    expect(validateFoundationMapping('palette.primary.base', validState())).toMatchObject({ valid: true, mapping: { mapping: 'preview-emulatable' } })
  })

  it('rejects metadata paths as editable foundation paths', () => {
    expect(validateFoundationMapping('explicitPaths', validState())).toMatchObject({
      valid: false,
      code: 'unsupported-mapping',
    })
  })

  it('keeps the canonical palette and shade allowlists explicit', () => {
    expect(PALETTE_NAMES).toEqual(['primary', 'success', 'warning', 'danger', 'info', 'gray'])
    expect(PALETTE_SHADES).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
  })
})
