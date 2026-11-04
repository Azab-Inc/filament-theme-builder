import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { validateFoundationState } from '@/utils/foundation-validation'
import { modeLinkTargetIdentity } from '@/models/mode-link-target.model'

describe('malformed legacy token links', () => {
  it('uses one identity regardless of descriptor property insertion order', () => {
    const first = { kind: 'raw' as const, selector: '.fi-section', property: 'color' as const }
    const second = { property: 'color' as const, selector: '.fi-section', kind: 'raw' as const }
    expect(modeLinkTargetIdentity(first)).toBe(modeLinkTargetIdentity(second))
  })
  it.each(['user-color', 'user-palette-base'] as const)('rejects %s links without userTokens without throwing', (kind) => {
    const state = createDefaultCurrentThemeState() as unknown as Record<string, unknown>
    state.schemaVersion = 6
    delete (state.foundations as Record<string, unknown>).userTokens
    const target = { kind, name: 'missing' }
    for (const identity of [modeLinkTargetIdentity(target), `target:${JSON.stringify(target)}`]) {
      state.modeLinks = { [identity]: { identity, value: '#123456', linked: true, target } }
      expect(() => validateFoundationState(state)).not.toThrow()
      expect(validateFoundationState(state).valid).toBe(false)
    }
  })
})
