import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { createThemeRegistry } from '@/registry/theme-registry'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { useThemeBorderActions } from '@/composables/use-theme-border-actions'

describe('theme border actions', () => {
  it('keeps light and dark edge values independent with inheritance', () => {
    const theme = ref(createDefaultCurrentThemeState())
    const actions = useThemeBorderActions({ theme, registry: createThemeRegistry() })
    const edge = { targetId: 'table.container', controlId: 'border' as const, edge: 'top' as const, property: 'width' as const, scope: 'global' as const }

    actions.setBorderEdge({ ...edge, value: 2, mode: 'light' })
    expect(theme.value.borderEdges[0]!).toMatchObject({ value: 2 })
    actions.setBorderEdge({ ...edge, value: 4, mode: 'dark' })
    expect(theme.value.borderEdges[0]!).toMatchObject({ value: 2, darkValue: 4 })
    actions.resetBorderEdge({ ...edge, mode: 'dark' })
    expect(theme.value.borderEdges[0]!).toMatchObject({ value: 2 })
    expect(theme.value.borderEdges[0]!.darkValue).toBeUndefined()
  })

  it('removes the edge override after resetting its final mode value', () => {
    const theme = ref(createDefaultCurrentThemeState())
    const actions = useThemeBorderActions({ theme, registry: createThemeRegistry() })
    const edge = { targetId: 'table.container', controlId: 'border' as const, edge: 'left' as const, property: 'style' as const, scope: 'global' as const }
    actions.setBorderEdge({ ...edge, value: 'none' })
    actions.resetBorderEdge(edge)
    expect(theme.value.borderEdges).toEqual([])
  })

  it('commits all-sides updates once and rejects the whole batch when one side is invalid', () => {
    const theme = ref(createDefaultCurrentThemeState())
    let commits = 0
    const actions = useThemeBorderActions({ theme, registry: createThemeRegistry(), commit: (next) => { commits += 1; theme.value = next } })
    const base = { targetId: 'table.container', controlId: 'border' as const, property: 'width' as const, scope: 'global' as const }
    actions.setBorderEdges([
      { ...base, edge: 'top' as const, value: 1 },
      { ...base, edge: 'right' as const, value: 2 },
      { ...base, edge: 'bottom' as const, value: -1 },
    ])
    expect(commits).toBe(0)
    expect(theme.value.borderEdges).toEqual([])
    actions.setBorderEdges([{ ...base, edge: 'top' as const, value: 1 }, { ...base, edge: 'right' as const, value: 2 }])
    expect(commits).toBe(1)
    expect(theme.value.borderEdges).toHaveLength(2)
  })
})
