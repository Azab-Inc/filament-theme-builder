import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { FoundationState } from '@/models/foundations.model'
import { createDefaultFoundationState } from '@/utils/foundation-defaults'
import { validateFoundationState } from '@/utils/foundation-validation'
import { TAILWIND_COLOR_FAMILIES, TAILWIND_COLOR_SHADES } from '@/registry/tailwind-color-catalog'

function validState(): FoundationState {
  return createDefaultFoundationState()
}

function expectError(value: unknown, code: string, path: string): void {
  expect(validateFoundationState(value)).toMatchObject({ valid: false, code, path })
}

describe('validateFoundationState values', () => {
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

  it.each(['var(--red-200)', 'var(--color-red-200)', 'var(--sky-950)', 'var(--color-sky-950)'])(
    'accepts an installed Tailwind v4 color reference %s', (reference) => {
      const state = validState()
      state.surfaces.sidebar.light = reference
      expect(validateFoundationState(state)).toMatchObject({ valid: true })
    },
  )

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
    expect(validateFoundationState(state)).toMatchObject({ valid: false, code: 'unsafe-font', path })
  })

  it.each([
    ['spacing.4', (state: FoundationState) => ({ ...state, spacing: { ...state.spacing, 4: Number.NaN } })],
    ['spacing.6', (state: FoundationState) => ({ ...state, spacing: { ...state.spacing, 6: Number.POSITIVE_INFINITY } })],
    ['borderWidth', (state: FoundationState) => ({ ...state, borderWidth: Number.NEGATIVE_INFINITY })],
  ])('rejects non-finite number at %s', (path, makeInvalid) => {
    expect(validateFoundationState(makeInvalid(validState()))).toMatchObject({ valid: false, code: 'invalid-value', path })
  })

  it('rejects missing required foundation sections and fixed-spacing violations', () => {
    const state = validState()
    const { text: _text, ...missingText } = state
    expect(validateFoundationState(missingText)).toMatchObject({ valid: false, code: 'invalid-value', path: 'text' })
    expect(validateFoundationState({ ...state, spacing: { ...state.spacing, '9': 36 } })).toMatchObject({ valid: false, code: 'unknown-key', path: 'spacing.9' })
    expect(validateFoundationState({ ...state, spacing: { ...state.spacing, '4': -1 } })).toMatchObject({ valid: false, code: 'invalid-value', path: 'spacing.4' })
    expect(validateFoundationState({ ...state, spacing: { ...state.spacing, '4': 257 } })).toMatchObject({ valid: false, code: 'invalid-value', path: 'spacing.4' })
  })
})
