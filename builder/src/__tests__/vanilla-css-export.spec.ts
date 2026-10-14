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

    const { css } = exportVanillaCss(theme)

    expect(css).toContain('.fi-btn { background-color: #0f766e !important; }')
    expect(css).toContain('.fi-btn { background-color: #dc2626 !important; }')
    expect(css).toContain('.fi-fo-text-input .fi-input:focus { background-color: #111827 !important; }')
    expect(css).toContain('.fi-color-primary { color: #7c3aed !important; }')
    expect(css.indexOf('.fi-btn { background-color: #0f766e')).toBeLessThan(css.indexOf('.fi-btn { background-color: #dc2626'))
    expect(css.indexOf('.fi-btn { background-color: #dc2626')).toBeLessThan(css.indexOf('.fi-fo-text-input .fi-input:focus'))
    expect(css.indexOf('.fi-fo-text-input .fi-input:focus')).toBeLessThan(css.indexOf('.fi-color-primary { color: #7c3aed'))
  })

  it('preserves global, component, and variant selector specificity', () => {
    const theme = createDefaultThemeState()
    theme.overrides = [
      { targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#111111' },
      { targetId: 'button.primary', controlId: 'background', scope: 'component', componentId: 'button', value: '#222222' },
      { targetId: 'button.primary', controlId: 'background', scope: 'variant', componentId: 'button', variantId: 'primary', value: '#333333' },
    ]

    const { css } = exportVanillaCss(theme)

    expect(css).toContain('.fi-btn { background-color: #111111 !important; }')
    expect(css).toContain('.fi-btn { background-color: #222222 !important; }')
    expect(css).toContain('.fi-btn.fi-color-primary { background-color: #333333 !important; }')
  })

  it('resolves the registered default state as the base variant selector', () => {
    const theme = createDefaultThemeState()
    theme.overrides = [{
      targetId: 'button.primary',
      controlId: 'background',
      scope: 'state',
      componentId: 'button',
      variantId: 'primary',
      stateId: 'default',
      value: '#111111',
    }]

    expect(exportVanillaCss(theme).css).toContain('.fi-btn.fi-color-primary { background-color: #111111 !important; }')
    expect(exportVanillaCss(theme).errors).toEqual([])
  })

  it.each([
    { targetId: 'button.primary', controlId: 'background', componentId: 'button', variantId: 'primary', stateId: 'hover', selector: '.fi-btn.fi-color-primary:hover' },
    { targetId: 'form.product-name', controlId: 'background', componentId: 'form', variantId: 'default', stateId: 'focus', selector: '.fi-fo-text-input .fi-input:focus' },
  ] as const)(
    'preserves the registered $stateId pseudo-state without rewriting it',
    ({ targetId, controlId, componentId, variantId, stateId, selector }) => {
      const theme = createDefaultThemeState()
      theme.overrides = [{
        targetId,
        controlId,
        scope: 'state',
        componentId,
        variantId,
        stateId,
        value: '#111111',
      }]

      const { css } = exportVanillaCss(theme)

      expect(css).toContain(`${selector} { background-color: #111111 !important; }`)
    },
  )

  it('rejects an unsupported semantic state instead of transforming it', () => {
    const theme = createDefaultThemeState()
    theme.overrides = [{
      targetId: 'button.primary',
      controlId: 'background',
      scope: 'state',
      componentId: 'button',
      variantId: 'primary',
      stateId: 'focus',
      value: '#111111',
    }]

    expect(exportVanillaCss(theme).errors).toContainEqual(expect.stringMatching(/Unsupported semantic override state/i))
  })

  it('rejects an unsupported semantic override instead of silently omitting it', () => {
    const theme = createDefaultThemeState()
    theme.overrides = [{
      targetId: 'button.primary',
      controlId: 'unsupported',
      scope: 'global',
      value: '#0f766e',
    }]

    expect(exportVanillaCss(theme).errors).toContainEqual(expect.stringMatching(/Unsupported semantic override/i))
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
