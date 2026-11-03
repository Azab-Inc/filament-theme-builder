import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { createThemeRegistry } from '@/registry/theme-registry'
import { useThemeRawActions } from '@/composables/use-theme-raw-actions'
import { useThemeOverrideActions } from '@/composables/use-theme-override-actions'
import { useThemePaletteActions } from '@/composables/use-theme-palette-actions'
import { ALL_RAW_VISUAL_PROPERTIES, type RawVisualProperty } from '@/models/raw-overrides.model'
import { PALETTE_NAMES, PALETTE_SHADES } from '@/models/foundations.model'
import type { ThemeStateCurrent } from '@/models/theme.model'
import { exportVanillaCss } from '@/utils/vanilla-css-export'
import { validateRawElementOverride } from '@/utils/raw-override-validation'
import { validateFoundationState } from '@/utils/foundation-validation'
import { renderSemanticOverrides } from '@/utils/vanilla-css-export-semantic-overrides'
import { renderRawOverrides } from '@/utils/vanilla-css-export-raw-overrides'
import { renderFoundations, renderDarkFoundations } from '@/utils/vanilla-css-export-foundations'

const registry = createThemeRegistry()
const state = () => ref(createDefaultCurrentThemeState() as ThemeStateCurrent)

describe('mode isolation domain actions', () => {
  it.each(ALL_RAW_VISUAL_PROPERTIES)('isolates raw %s per mode', (property) => {
    const theme = state()
    const actions = useThemeRawActions({ theme, registry })
    const value = rawValue(property)
    actions.setRawOverride('.fi-sidebar-item-label', property, value, 'light')
    actions.setRawOverride('.fi-sidebar-item-label', property, darkValue(property), 'dark')
    const override = theme.value.rawOverrides[0]!
    expect(override.properties[property]).toBe(value)
    expect(override.darkProperties?.[property]).toBe(darkValue(property))
    expect(Object.keys(override.properties)).toEqual([property])
    expect(Object.keys(override.darkProperties ?? {})).toEqual([property])
  })

  it('keeps semantic scopes and state variants independent', () => {
    const theme = state()
    const actions = useThemeOverrideActions({ theme, registry })
    const contexts = [
      { scope: 'global' as const },
      { scope: 'component' as const, componentId: 'button' },
      { scope: 'variant' as const, componentId: 'button', variantId: 'primary' },
      { scope: 'state' as const, componentId: 'button', variantId: 'primary', stateId: 'hover' },
    ]
    for (const context of contexts) {
      actions.setOverride({ targetId: 'button.primary', controlId: 'background', ...context, value: '#123456', mode: 'light' })
      actions.setOverride({ targetId: 'button.primary', controlId: 'background', ...context, value: '#abcdef', mode: 'dark' })
      const { scope: _scope, ...requestContext } = context
      expect(actions.resolve({ targetId: 'button.primary', controlId: 'background', ...requestContext, mode: 'light' })).toMatchObject({ value: '#123456' })
      expect(actions.resolve({ targetId: 'button.primary', controlId: 'background', ...requestContext, mode: 'dark' })).toMatchObject({ value: '#abcdef' })
    }
  })

  it('supports every palette base and shade in both modes without freezing light values', () => {
    const theme = state()
    const actions = useThemePaletteActions({ theme, registry })
    for (const [index, name] of PALETTE_NAMES.entries()) {
      actions.setPaletteBase(name, `#${String(index + 1).repeat(6)}`, 'light')
      actions.setPaletteBase(name, `#${String(index + 2).repeat(6)}`, 'dark')
      for (const shade of PALETTE_SHADES) actions.setPaletteShadeOverride(name, shade, `#${String((index + 3) % 10).repeat(6)}`, 'dark')
      expect(theme.value.foundations.palettes[name].base).toBe(`#${String(index + 1).repeat(6)}`)
      expect(theme.value.foundations.palettes[name].dark?.base).toBe(`#${String(index + 2).repeat(6)}`)
      expect(Object.keys(theme.value.foundations.palettes[name].dark?.overrides ?? {})).toHaveLength(PALETTE_SHADES.length)
    }
  })

  it('resolves sparse dark palette overlays from the latest light palette for every family and shade', () => {
    const theme = state()
    const actions = useThemePaletteActions({ theme, registry })
    for (const name of PALETTE_NAMES) {
      actions.setPaletteShadeOverride(name, 50, '#111111', 'dark')
      actions.setPaletteShadeOverride(name, 100, '#222222', 'light')
      expect(theme.value.foundations.palettes[name].dark?.overrides?.[50]).toBe('#111111')
      expect(theme.value.foundations.palettes[name].dark?.overrides?.[100]).toBeUndefined()
      expect(theme.value.foundations.palettes[name].dark?.shades?.[100]).toBeUndefined()
    }
    const projected = theme.value.foundations.palettes.primary
    expect(projected.shades[100]).toBe('#222222')
    expect(projected.dark?.overrides?.[50]).toBe('#111111')
    actions.resetPaletteShade('primary', 50, 'dark')
    expect(theme.value.foundations.palettes.primary.dark?.overrides?.[50]).toBeUndefined()
  })

  it('exports root-safe mode-scoped foundation variables', () => {
    const theme = createDefaultCurrentThemeState()
    theme.foundations.explicitPaths = ['palettes.primary.base', 'palettes.primary.dark.base']
    const light = renderFoundations(theme, 'light')
    const dark = renderDarkFoundations(theme)
    expect(light).toContain(':where(html:not(.dark)) { --ftb-primary')
    expect(dark).toContain(':where(html.dark) { --ftb-primary')
    expect(dark).not.toContain('.dark {')
  })

  it('resets dark values back to current light inheritance', () => {
    const theme = state()
    const actions = useThemeRawActions({ theme, registry })
    actions.setRawOverride('.fi-input', 'color', '#123456', 'light')
    actions.setRawOverride('.fi-input', 'color', '#abcdef', 'dark')
    actions.resetRawProperty('.fi-input', 'color', 'dark')
    expect(theme.value.rawOverrides[0]?.darkProperties).toBeUndefined()
    actions.setRawOverride('.fi-input', 'color', '#654321', 'light')
    expect(theme.value.rawOverrides[0]?.properties.color).toBe('#654321')
  })

  it('resets semantic dark only without changing light and keeps explicit equal dark values', () => {
    const theme = state()
    const actions = useThemeOverrideActions({ theme, registry })
    actions.setOverride({ targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#123456', mode: 'light' })
    actions.setOverride({ targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#123456', mode: 'dark' })
    actions.resetOverride({ targetId: 'button.primary', controlId: 'background', mode: 'dark' })
    expect(theme.value.overrides[0]?.value).toBe('#123456')
    expect(theme.value.overrides[0]?.darkValue).toBeUndefined()
    actions.setOverride({ targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#abcdef', mode: 'dark' })
    actions.resetOverride({ targetId: 'button.primary', controlId: 'background', mode: 'light' })
    expect(theme.value.overrides[0]?.value).toBeUndefined()
    expect(theme.value.overrides[0]?.darkValue).toBe('#abcdef')
  })

  it('keeps dark-only semantic edits from creating a light value', () => {
    const theme = state()
    const actions = useThemeOverrideActions({ theme, registry })
    actions.setOverride({ targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#abcdef', mode: 'dark' })
    expect(theme.value.overrides[0]?.value).toBeUndefined()
    expect(theme.value.overrides[0]?.darkValue).toBe('#abcdef')
  })

  it('renames and resets raw overrides per active mode', () => {
    const theme = state()
    const actions = useThemeRawActions({ theme, registry })
    actions.setRawOverride('.fi-old', 'color', '#111111', 'light')
    actions.setRawOverride('.fi-old', 'color', '#222222', 'dark')
    expect(actions.renameRawOverride('.fi-old', '.fi-new')).toBe(true)
    expect(theme.value.rawOverrides[0]?.darkProperties?.color).toBe('#222222')
    actions.resetRawOverride('.fi-new', 'dark')
    expect(theme.value.rawOverrides[0]?.properties.color).toBe('#111111')
    expect(theme.value.rawOverrides[0]?.darkProperties).toBeUndefined()
  })

  it('validates and exports schema-v6 padding', () => {
    const theme = createDefaultCurrentThemeState()
    theme.padding = [{ scope: 'component', targetId: 'forms.input', edges: { top: '8px' } }]
    expect(validateFoundationState(theme).valid).toBe(true)
    const errors: string[] = []
    expect(renderSemanticOverrides(theme, errors)).toContain('padding-top: 8px')
    expect(errors).toEqual([])
  })

  it('rejects malformed schema-v6 padding during import validation', () => {
    const theme = createDefaultCurrentThemeState() as unknown as Record<string, unknown>
    theme.padding = [{ scope: 'component', targetId: 'forms.input', edges: { top: 8 } }]
    expect(validateFoundationState(theme).valid).toBe(false)
  })

  it('exports mode-exclusive raw and semantic CSS guards', () => {
    const theme = createDefaultCurrentThemeState()
    theme.overrides = [{ targetId: 'button.primary', controlId: 'background', scope: 'state', stateId: 'hover', value: '#111111', darkValue: '#222222' }]
    theme.rawOverrides = [{ selector: '.fi-sidebar-item.fi-active .fi-sidebar-item-label', properties: { color: '#111111' }, darkProperties: { color: '#222222' } }]
    const errors: string[] = []
    const css = `${renderSemanticOverrides(theme, errors)}\n${renderRawOverrides(theme, errors)}`
    expect(css).toContain(':where(html:not(.dark))')
    expect(css).toContain(':where(html.dark)')
  })

  it('emits light values as dark fallbacks until a dark overlay exists', () => {
    const theme = createDefaultCurrentThemeState()
    theme.overrides = [{ targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#123456' }]
    theme.rawOverrides = [{ selector: '.fi-sidebar-item-label', properties: { color: '#123456' } }]
    const errors: string[] = []
    const css = `${renderSemanticOverrides(theme, errors)}\n${renderRawOverrides(theme, errors)}`
    expect(css).toContain(':where(html.dark) .fi-btn { background-color: #123456 !important; }')
    expect(css).toContain(':where(html.dark) .fi-sidebar-item-label {')
    expect(css).toContain('color: #123456;')
  })

  it('exports mode overlays with generated dark scoping', () => {
    const theme = createDefaultCurrentThemeState()
    theme.overrides = [{ targetId: 'button.primary', controlId: 'background', scope: 'global', value: '#123456', darkValue: '#abcdef' }]
    theme.rawOverrides = [{ selector: '.fi-sidebar-item-label', properties: { color: '#123456' }, darkProperties: { color: '#abcdef' } }]
    const result = exportVanillaCss(theme)
    expect(result.errors).toEqual([])
    expect(result.css).toContain(':where(html:not(.dark)) .fi-btn { background-color: #123456 !important; }')
    expect(result.css).toContain(':where(html.dark) .fi-btn { background-color: #abcdef !important; }')
    expect(result.css).toContain(':where(html.dark) .fi-sidebar-item-label {')
  })

  it('rejects malformed mode payloads and unsafe CSS mode selectors', () => {
    expect(validateRawElementOverride({ selector: '.dark .fi-btn', properties: { color: '#123456' } }).valid).toBe(false)
    expect(validateRawElementOverride({ selector: '.fi-btn', properties: {}, darkProperties: { color: '#123456' } }).valid).toBe(true)
    const theme = createDefaultCurrentThemeState()
    theme.foundations.palettes.primary.dark = { base: '#123456' }
    theme.foundations.explicitPaths.push('palettes.primary.dark.base', 'palettes.primary.dark.base')
    expect(validateFoundationState(theme)).toMatchObject({ valid: false, code: 'invalid-value' })
  })
})

function rawValue(property: RawVisualProperty): string {
  return property === 'color' || property.endsWith('color') ? '#123456' : property === 'opacity' ? '0.5' : property === 'font-weight' ? '600' : property === 'line-height' ? '1.5' : property === 'font-family' ? 'Inter' : property === 'box-shadow' ? '0 1px 2px #123456' : property === 'text-decoration' ? 'underline' : property === 'border-style' ? 'solid' : property === 'text-align' ? 'center' : property === 'white-space' ? 'nowrap' : property === 'padding' || property === 'margin' ? '1px 2px' : '1px'
}

function darkValue(property: RawVisualProperty): string { return property === 'opacity' ? '0.75' : property === 'font-weight' ? '700' : property === 'color' || property.endsWith('color') ? '#abcdef' : rawValue(property) }
