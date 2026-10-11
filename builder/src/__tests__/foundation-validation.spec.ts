import { describe, expect, it } from 'vitest'

import { PALETTE_NAMES, PALETTE_SHADES, type FoundationState } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/services/foundation-defaults'
import { validateFoundationMapping, validateFoundationState } from '@/services/foundation-validation'

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
  ])('rejects malformed colors at %s', (path, makeInvalid) => {
    expectError(makeInvalid(validState()), 'invalid-value', path)
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

  it('rejects unsupported mapping identifiers without coercing them', () => {
    expect(validateFoundationMapping('surface.page')).toMatchObject({ valid: false, code: 'unsupported-mapping', path: 'mapping' })
    expect(validateFoundationMapping('palette.primary.base')).toMatchObject({ valid: true })
  })

  it('keeps the canonical palette and shade allowlists explicit', () => {
    expect(PALETTE_NAMES).toEqual(['primary', 'success', 'warning', 'danger', 'info', 'gray'])
    expect(PALETTE_SHADES).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950])
  })
})
