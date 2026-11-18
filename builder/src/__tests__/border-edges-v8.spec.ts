import { describe, expect, it } from 'vitest'
import { createThemeRegistry } from '@/registry/theme-registry'
import { validateBorderEdge } from '@/utils/border-edge-validation'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'

describe('schema V8 sparse border edges', () => {
  it('migrates a V7 theme without materializing legacy aggregate edges', () => {
    const current = createDefaultCurrentThemeState()
    const { borderEdges: _borderEdges, ...source } = { ...current, schemaVersion: 7 as const }
    const result = migrateVersionedTheme(source, createThemeRegistry())

    expect(result.ok).toBe(true)
    if (!result.ok) return
    const state = result.state as typeof result.state & { borderEdges: unknown[] }
    expect(state.schemaVersion).toBe(8)
    expect(state.borderEdges).toEqual([])
  })

  it('accepts unlimited finite nonnegative semantic widths in the V8 contract', () => {
    const edge = { targetId: 'form.product-name', controlId: 'border', edge: 'bottom', property: 'width', scope: 'component', componentId: 'form', value: 1000000 }
    expect(Number.isFinite(edge.value) && edge.value >= 0).toBe(true)
    expect(Number.isFinite(Number.POSITIVE_INFINITY) && Number.POSITIVE_INFINITY >= 0).toBe(false)
  })

  it('rejects registry targets without verified border catalog metadata', () => {
    expect(validateBorderEdge({ targetId: 'button.primary', controlId: 'border', edge: 'top', property: 'width', scope: 'global', value: 1 }, createThemeRegistry()).valid).toBe(false)
  })
})
