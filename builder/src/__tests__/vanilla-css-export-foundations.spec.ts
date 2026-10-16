import { describe, expect, it } from 'vitest'

import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { exportVanillaCss } from '@/utils/vanilla-css-export'

describe('minimal vanilla CSS export', () => {
  it('emits readable explicit foundation, semantic, and raw rules in deterministic order', () => {
    const theme = createDefaultThemeState()
    theme.colors.primary = '#0f766e'
    theme.foundations.palettes.primary.base = '#0f766e'
    theme.foundations.explicitPaths = ['palettes.primary.base']
    theme.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#ffffff', padding: '0.5rem 1rem' } }]

    const { css } = exportVanillaCss(theme)

    expect(css).toContain('/* Generated with Filament Theme Builder */')
    expect(css).toContain('/* Foundations */')
    expect(css).toContain('/* Advanced raw-element overrides */')
    expect(css).toContain('.fi-btn {')
    expect(css).toContain('color: #ffffff;')
    expect(css).toContain('padding: 0.5rem 1rem;')
    expect(css.indexOf('/* Semantic overrides */')).toBeLessThan(css.indexOf('/* Advanced raw-element overrides */'))
    expect(css).not.toContain('/* default')
  })

  it('does not emit unedited foundations', () => {
    const theme = createDefaultThemeState()

    expect(exportVanillaCss(theme).css).not.toContain('--ftb-primary')
  })

  it('returns validation errors alongside the valid CSS when a raw override is invalid', () => {
    const theme = createDefaultThemeState()
    theme.foundations.explicitPaths = ['palettes.primary.base']
    theme.rawOverrides = [
      { selector: '.fi-btn', properties: { color: '#ffffff' } },
      { selector: '.unsafe', properties: { color: '#000000' } },
    ]

    const result = exportVanillaCss(theme)

    expect(result.css).toContain('/* Foundations */')
    expect(result.css).toContain('.fi-btn')
    expect(result.css).not.toContain('.unsafe')
    expect(result.errors).toContainEqual(expect.stringMatching(/safe \.fi-\* class selectors/i))
  })
})
