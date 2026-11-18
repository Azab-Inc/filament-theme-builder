import { describe, expect, it } from 'vitest'
import { createThemeRegistry } from '@/registry/theme-registry'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { resolveBorderEdge } from '@/utils/border-edge-resolver'
import { useThemeBorderActions } from '@/composables/use-theme-border-actions'
import { ref } from 'vue'

describe('border edge resolver', () => {
  it('resolves state over component and global values', () => {
    const state = createDefaultCurrentThemeState()
    state.borderEdges = [
      { targetId: 'form.product-name', controlId: 'border', edge: 'top', property: 'width', scope: 'global', value: 1 },
      { targetId: 'form.product-name', controlId: 'border', edge: 'top', property: 'width', scope: 'component', componentId: 'form', value: 2 },
      { targetId: 'form.product-name', controlId: 'border', edge: 'top', property: 'width', scope: 'state', stateId: 'hover', value: 4 },
    ]
    const resolved = resolveBorderEdge(state, createThemeRegistry(), { targetId: 'form.product-name', componentId: 'form', stateId: 'hover' }, 'top', 'width')
    expect(resolved.value).toBe(4)
    expect(resolved.source).toBe('state')
  })

  it('inherits a light value in dark mode until dark is explicit', () => {
    const state = createDefaultCurrentThemeState()
    state.borderEdges = [{ targetId: 'form.product-name', controlId: 'border', edge: 'right', property: 'style', scope: 'global', value: 'dashed' }]
    const inherited = resolveBorderEdge(state, createThemeRegistry(), { targetId: 'form.product-name', mode: 'dark' }, 'right', 'style')
    expect(inherited.value).toBe('dashed')
    expect(inherited.explicit).toBe(false)
    state.borderEdges[0]!.darkValue = 'solid'
    expect(resolveBorderEdge(state, createThemeRegistry(), { targetId: 'form.product-name', mode: 'dark' }, 'right', 'style').explicit).toBe(true)
  })

  it('keeps aggregate writes atomic, lets a later edge win, and restores native fallback on reset', () => {
    const theme = ref(createDefaultCurrentThemeState())
    const registry = createThemeRegistry()
    const actions = useThemeBorderActions({ theme, registry })
    const context = { targetId: 'table.container', controlId: 'border' as const, scope: 'global' as const }
    actions.setBorderEdges((['top', 'right', 'bottom', 'left'] as const).map((edge) => ({ ...context, edge, property: 'width' as const, value: 2 })))
    actions.setBorderEdge({ ...context, edge: 'top', property: 'width', value: 4 })
    expect(resolveBorderEdge(theme.value, registry, { targetId: 'table.container' }, 'top', 'width').value).toBe(4)
    expect(resolveBorderEdge(theme.value, registry, { targetId: 'table.container' }, 'right', 'width').value).toBe(2)
    actions.resetBorderEdge({ ...context, edge: 'top', property: 'width' })
    expect(resolveBorderEdge(theme.value, registry, { targetId: 'table.container' }, 'top', 'width').value).toBeNull()
  })
})
