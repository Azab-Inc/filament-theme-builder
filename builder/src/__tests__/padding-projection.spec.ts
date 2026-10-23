import { describe, expect, it } from 'vitest'

import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { createThemeRegistry } from '@/registry/theme-registry'
import { projectPadding } from '@/utils/padding-projection'
import { serializeCanonicalTheme } from '@/utils/theme-serialization'

describe('padding projection', () => {
  it('projects inherited leaf values but never container defaults or table cells', () => {
    const state = createDefaultCurrentThemeState()
    state.padding = [{ scope: 'global', edges: { top: '8px', right: '0', bottom: '8px', left: '8px' } }]

    const projection = projectPadding(state, createThemeRegistry())

    expect(projection.rules.some((rule) => rule.targetId === 'forms.input')).toBe(true)
    expect(projection.rules.some((rule) => rule.targetId === 'forms.section')).toBe(false)
    expect(projection.rules.map(({ selector }) => selector)).not.toContain('.fi-ta-cell')
    expect(projection.rules.find((rule) => rule.targetId === 'tables.cell.text')?.declarations).toEqual({ top: '8px', right: '0', bottom: '8px', left: '8px' })
  })

  it('uses explicit container values and removes native edges from output', () => {
    const state = createDefaultCurrentThemeState()
    state.padding = [{ scope: 'component', targetId: 'tables.container', edges: { top: '12px' } }]

    const projection = projectPadding(state, createThemeRegistry())
    const rule = projection.rules.find((candidate) => candidate.targetId === 'tables.container')

    expect(rule?.selector).toBe('.fi-ta')
    expect(rule?.declarations).toEqual({ top: '12px' })
    expect(JSON.stringify(state)).not.toContain('resolved')
  })

  it('keeps canonical JSON sparse while projection contains derived rules', () => {
    const state = createDefaultCurrentThemeState()
    state.padding = [{ scope: 'global', edges: { top: '8px' } }]

    expect(serializeCanonicalTheme(state).padding).toEqual(state.padding)
    expect(JSON.stringify(serializeCanonicalTheme(state))).not.toContain('resolved')
  })
})
