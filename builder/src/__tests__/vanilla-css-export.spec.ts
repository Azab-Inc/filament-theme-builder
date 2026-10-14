import { describe, expect, it } from 'vitest'

import { createDefaultThemeState } from '@/services/foundation-defaults'
import { exportVanillaCss } from '@/services/vanilla-css-export'

describe('minimal vanilla CSS export', () => {
  it('emits readable explicit foundation, semantic, and raw rules in deterministic order', () => {
    const theme = createDefaultThemeState()
    theme.colors.primary = '#0f766e'
    theme.foundations.palettes.primary.base = '#0f766e'
    theme.foundations.explicitPaths = ['palettes.primary.base']
    theme.rawOverrides = [{ selector: '.fi-btn', properties: { color: '#ffffff', padding: '0.5rem 1rem' } }]

    const css = exportVanillaCss(theme)

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

    expect(exportVanillaCss(theme)).not.toContain('--ftb-primary')
  })

  it('serializes every supported semantic override in stable order', () => {
    const theme = createDefaultThemeState()
    theme.overrides = [
      {
        targetId: 'form.product-name',
        controlId: 'background',
        scope: 'state',
        componentId: 'form',
        variantId: 'default',
        stateId: 'focus',
        value: '#111827',
      },
      {
        targetId: 'button.secondary',
        controlId: 'background',
        scope: 'global',
        value: '#dc2626',
      },
      {
        targetId: 'button.primary',
        controlId: 'background',
        scope: 'global',
        value: '#0f766e',
      },
      {
        targetId: 'global.primary',
        controlId: 'primary',
        scope: 'global',
        value: '#7c3aed',
      },
    ]

    const css = exportVanillaCss(theme)

    expect(css).toContain('.fi-btn.fi-color-primary { background-color: #0f766e !important; }')
    expect(css).toContain('.fi-btn.fi-outlined { background-color: #dc2626 !important; }')
    expect(css).toContain('.fi-fo-text-input .fi-input:focus { background-color: #111827 !important; }')
    expect(css).toContain('.fi-color-primary { color: #7c3aed !important; }')
    expect(css.indexOf('.fi-btn.fi-color-primary')).toBeLessThan(css.indexOf('.fi-btn.fi-outlined'))
    expect(css.indexOf('.fi-btn.fi-outlined')).toBeLessThan(css.indexOf('.fi-fo-text-input .fi-input:focus'))
    expect(css.indexOf('.fi-fo-text-input .fi-input:focus')).toBeLessThan(css.indexOf('.fi-color-primary { color: #7c3aed'))
  })

  it('rejects an unsupported semantic override instead of silently omitting it', () => {
    const theme = createDefaultThemeState()
    theme.overrides = [{
      targetId: 'button.primary',
      controlId: 'unsupported',
      scope: 'global',
      value: '#0f766e',
    }]

    expect(() => exportVanillaCss(theme)).toThrow(/Unsupported semantic override/i)
  })
})
