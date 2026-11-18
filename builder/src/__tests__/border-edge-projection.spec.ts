import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { projectBorderEdges } from '@/utils/border-edge-projection'
import { readThemeBorders } from '@/utils/theme-border-read'

describe('border edge projection', () => {
  it('emits physical longhands without suppressing focus and scopes ring suppression separately', () => {
    const theme = createDefaultCurrentThemeState()
    theme.borderEdges = [{ targetId: 'table.container', controlId: 'border', edge: 'bottom', property: 'width', scope: 'global', value: 3 }]
    const rules = projectBorderEdges(theme, 'light')
    expect(rules).toHaveLength(2)
    const borderRule = rules.find((rule) => rule.declarations['border-bottom-width'])!
    const ringRule = rules.find((rule) => rule.declarations['--tw-ring-shadow'])!
    expect(borderRule.selector).not.toContain(':not(:focus)')
    expect(borderRule.declarations['border-bottom-width']).toBe('3px')
    expect(borderRule.declarations['border-top-width']).toBe('1px')
    expect(ringRule.selector).toContain(':not(:focus)')
    expect(ringRule.declarations).toEqual({ '--tw-ring-shadow': '0 0 #0000' })
  })

  it('keeps explicit zero/none/color siblings and dark inheritance equivalent to the resolved preview', () => {
    const theme = createDefaultCurrentThemeState()
    theme.borderEdges = [
      { targetId: 'table.container', controlId: 'border', edge: 'top', property: 'width', scope: 'global', value: 2 },
      { targetId: 'table.container', controlId: 'border', edge: 'bottom', property: 'width', scope: 'global', value: 0, darkValue: 3 },
      { targetId: 'table.container', controlId: 'border', edge: 'bottom', property: 'style', scope: 'global', value: 'none' },
      { targetId: 'table.container', controlId: 'border', edge: 'top', property: 'color', scope: 'global', value: '#123456' },
    ]
    const light = projectBorderEdges(theme, 'light').find((rule) => rule.selector.includes('.fi-ta-ctn'))!
    const dark = projectBorderEdges(theme, 'dark').find((rule) => rule.selector.includes('.fi-ta-ctn'))!
    expect(light.declarations).toMatchObject({ 'border-top-width': '2px', 'border-bottom-width': '0px', 'border-bottom-style': 'none', 'border-top-color': '#123456' })
    expect(dark.declarations).toMatchObject({ 'border-top-width': '2px', 'border-bottom-width': '3px', 'border-bottom-style': 'none', 'border-top-color': '#123456' })
  })

  it('projects scoped state values to verified pseudo selectors and does not leak dark-only edges into light', () => {
    const theme = createDefaultCurrentThemeState()
    theme.borderEdges = [
      { targetId: 'form.product-name', controlId: 'border', edge: 'top', property: 'width', scope: 'global', value: 1 },
      { targetId: 'form.product-name', controlId: 'border', edge: 'top', property: 'width', scope: 'state', stateId: 'hover', value: 4 },
      { targetId: 'form.product-name', controlId: 'border', edge: 'right', property: 'width', scope: 'global', darkValue: 6 },
    ]
    const light = projectBorderEdges(theme, 'light')
    const dark = projectBorderEdges(theme, 'dark')
    expect(light.filter((rule) => rule.declarations['border-top-width'])).toHaveLength(2)
    expect(light.find((rule) => rule.selector.includes(':hover'))?.declarations['border-top-width']).toBe('4px')
    expect(light.some((rule) => rule.declarations['border-right-width'] === '6px')).toBe(false)
    expect(dark.some((rule) => rule.declarations['border-right-width'] === '6px')).toBe(true)
  })

  it('reads canonical effective values and provenance through the shared resolver', () => {
    const theme = createDefaultCurrentThemeState()
    theme.borderEdges = [{ targetId: 'table.container', controlId: 'border', edge: 'top', property: 'width', scope: 'global', darkValue: 4 }]
    theme.rawOverrides = [{ selector: '.fi-input-wrp', properties: { 'border-top-width': '2px' } }]
    const reads = readThemeBorders(theme)
    expect(reads.find((read) => read.targetId === 'table.container' && read.edge === 'top')?.effectiveValues.light).toContain('1px')
    expect(reads.find((read) => read.targetId === 'table.container' && read.edge === 'top')?.effectiveValues.dark).toBe(4)
    expect(reads.find((read) => read.targetId === '.fi-input-wrp')?.provenance).toBe('raw')
  })

  it('reports dark-only raw values without inventing a light value and exposes native catalog targets', () => {
    const theme = createDefaultCurrentThemeState()
    theme.rawOverrides = [{ selector: '.fi-input-wrp', properties: {}, darkProperties: { 'border-top-width': '2px' } }]
    const reads = readThemeBorders(theme)
    const raw = reads.find((read) => read.targetId === '.fi-input-wrp' && read.edge === 'top' && read.property === 'width')!
    expect(raw.effectiveValues).toEqual({ light: null, dark: '2px' })
    expect(raw.explicit).toEqual({ light: false, dark: true })
    expect(reads.some((read) => read.targetId === 'table.header' && read.provenance === 'native')).toBe(true)
  })

  it('bridges focus state to the verified wrapper focus-within owner', () => {
    const theme = createDefaultCurrentThemeState()
    theme.borderEdges = [{ targetId: 'form.product-name', controlId: 'border', edge: 'bottom', property: 'width', scope: 'state', stateId: 'focus', value: 4 }]
    const rule = projectBorderEdges(theme, 'light').find((candidate) => candidate.declarations['border-bottom-width'])!
    expect(rule.selector).toContain('.fi-input-wrp:focus-within')
    expect(rule.selector).not.toContain('.fi-input-wrp input:focus')
  })
})
