import { describe, expect, it } from 'vitest'

import type { ResolveRequest } from '@/models/theme.model'
import {
  createThemeState,
  resetThemeStateTest,
} from './theme-state-test-helpers'

describe('theme state icons and history', () => {
  resetThemeStateTest()

  it('reports rejected raw selector renames without leaving a stale destination selected', () => {
    const store = createThemeState()
    store.setRawOverride('.fi-btn', 'color', '#0f766e')
    store.setRawOverride('.fi-input', 'color', '#dc2626')

    expect(store.renameRawOverride('.fi-btn', '.fi-input')).toBe(false)
    expect(store.theme.rawOverrides).toEqual([
      { selector: '.fi-btn', properties: { color: '#0f766e' } },
      { selector: '.fi-input', properties: { color: '#dc2626' } },
    ])
    expect(store.renameRawOverride('.fi-btn', '.fi-section')).toBe(true)
    expect(store.theme.rawOverrides).toContainEqual({ selector: '.fi-section', properties: { color: '#0f766e' } })
  })

  it('selects an icon pack and resets individual semantic overrides', () => {
    const store = createThemeState()

    store.setIconPack('solid')
    store.setSemanticResourceIcon('products', 'heroicon-o-cube')

    expect(store.theme.icons).toEqual({ pack: 'solid', overrides: { products: 'heroicon-o-cube' } })
    store.resetSemanticResourceIcon('products')
    expect(store.theme.icons).toEqual({ pack: 'solid', overrides: {} })

    store.resetIconConfiguration()
    expect(store.theme.icons).toEqual({ pack: 'default', overrides: {} })
  })

  it('records an explicit primary selection even when it equals the native default', () => {
    const theme = createThemeState()

    theme.setPrimaryColor('#6366f1')

    expect(theme.theme.foundations.explicitPaths).toContain('palettes.primary.base')
    expect(theme.previewFoundation('light').mappings.filter(({ id }) => id.startsWith('palette.primary.'))).toHaveLength(12)
  })

  it('edits and resets the Product name target through canonical history without copying inherited values', () => {
    const store = createThemeState()
    const request: ResolveRequest = {
      targetId: 'form.product-name',
      controlId: 'background',
      componentId: 'form',
      variantId: 'default',
      stateId: 'focus',
    }

    store.setOverride({ targetId: 'form.product-name', controlId: 'background', scope: 'global', value: '#111827' })
    store.setOverride({ targetId: 'form.product-name', controlId: 'background', scope: 'component', componentId: 'form', value: '#1f2937' })
    store.setOverride({ targetId: 'form.product-name', controlId: 'background', scope: 'variant', componentId: 'form', variantId: 'default', value: '#374151' })
    store.setOverride({ targetId: 'form.product-name', controlId: 'background', scope: 'state', componentId: 'form', variantId: 'default', stateId: 'focus', value: '#4b5563' })

    expect(store.resolve(request)).toMatchObject({ value: '#4b5563', source: 'state' })
    store.resetOverride(request)
    expect(store.resolve(request)).toMatchObject({ value: '#374151', source: 'variant' })
    store.undo()
    expect(store.resolve(request)).toMatchObject({ value: '#4b5563', source: 'state' })
    store.redo()
    expect(store.resolve(request)).toMatchObject({ value: '#374151', source: 'variant' })
    store.setOverride({ targetId: 'form.product-name', controlId: 'background', scope: 'component', componentId: 'form', value: '#0f766e' })
    expect(store.resolve(request)).toMatchObject({ value: '#374151', source: 'variant' })
    expect(store.theme.overrides.some((override) => override.scope === 'state')).toBe(false)
  })

  it('undoes and redoes color changes', () => {
    const theme = createThemeState()
    theme.setPrimaryColor('#0f766e')
    theme.undo()
    expect(theme.theme.colors.primary).toBe('#6366f1')
    theme.redo()
    expect(theme.theme.colors.primary).toBe('#0f766e')
  })

  it('clears the redo branch when a new edit follows undo', () => {
    const theme = createThemeState()
    theme.setPrimaryColor('#0f766e')
    theme.undo()
    theme.setPrimaryColor('#dc2626')

    expect(theme.canRedo).toBe(false)
    theme.redo()
    expect(theme.theme.colors.primary).toBe('#dc2626')
  })
})
