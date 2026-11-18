import { describe, expect, it } from 'vitest'

import { createDefaultCurrentThemeState, createDefaultThemeState } from '@/utils/foundation-defaults'
import { exportVanillaCss } from '@/utils/vanilla-css-export'

describe('vanilla CSS semantic overrides', () => {
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
    const theme = createDefaultCurrentThemeState()
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

  it('exports padding from the shared projection and omits native edges', () => {
    const theme = { ...createDefaultThemeState(), schemaVersion: 5 as const, padding: [{ scope: 'global' as const, edges: { top: '8px', right: '0' as const } }] }

    const { css } = exportVanillaCss(theme)

    expect(css).toContain('.fi-fo-text-input .fi-input { padding-top: 8px !important; padding-right: 0 !important; }')
    expect(css).not.toContain('.fi-ta-cell {')
  })

  it('exports sparse border edges with the same light/dark physical projection as preview', () => {
    const theme = createDefaultCurrentThemeState()
    theme.borderEdges = [
      { targetId: 'table.container', controlId: 'border', edge: 'bottom', property: 'width', scope: 'global', value: 2, darkValue: 4 },
      { targetId: 'table.container', controlId: 'border', edge: 'bottom', property: 'color', scope: 'global', value: '#123456' },
    ]
    const { css, errors } = exportVanillaCss(theme)
    expect(errors).toEqual([])
    expect(css).toContain(':where(html:not(.dark)) .fi-ta-ctn {')
    expect(css).toContain('border-bottom-width: 2px !important')
    expect(css).toContain(':where(html.dark) .fi-ta-ctn {')
    expect(css).toContain('border-bottom-width: 4px !important')
    expect(css).toContain('border-bottom-color: #123456 !important')
  })

  it('exports a fresh fixture with fully explicit physical border parity', () => {
    const theme = createDefaultCurrentThemeState()
    theme.borderEdges = [
      { targetId: 'table.container', controlId: 'border', edge: 'top', property: 'width', scope: 'global', value: 1, darkValue: 2 },
      { targetId: 'table.container', controlId: 'border', edge: 'right', property: 'style', scope: 'global', value: 'dashed', darkValue: 'dashed' },
      { targetId: 'table.container', controlId: 'border', edge: 'bottom', property: 'style', scope: 'global', value: 'none' },
      { targetId: 'table.container', controlId: 'border', edge: 'left', property: 'color', scope: 'global', value: '#123456', darkValue: '#654321' },
    ]
    const { css, errors } = exportVanillaCss(theme)
    expect(errors).toEqual([])
    expect(css).toContain('border-top-width: 1px !important')
    expect(css).toContain('border-top-width: 2px !important')
    expect(css).toContain('border-right-style: dashed !important')
    expect(css).toContain('border-bottom-style: none !important')
    expect(css).toContain('border-left-color: #123456 !important')
    expect(css).toContain('border-left-color: #654321 !important')
  })
})
