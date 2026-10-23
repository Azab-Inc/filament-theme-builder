import { describe, expect, it } from 'vitest'

import type { PaddingRecord } from '@/models/padding.model'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { resolvePadding, readPadding } from '@/utils/padding-resolver'
import { createThemeRegistry } from '@/registry/theme-registry'

const registry = createThemeRegistry()
const target = { targetId: 'buttons.default' }

function stateWith(...padding: PaddingRecord[]) {
  return { ...createDefaultCurrentThemeState(), padding }
}

describe('padding resolver', () => {
  it('resolves each edge independently through all five scopes', () => {
    const state = stateWith(
      { scope: 'global', edges: { top: '1px', right: '2px', bottom: '3px', left: '4px' } },
      { scope: 'section', sectionId: 'buttons', edges: { top: '5px' } },
      { scope: 'component', targetId: 'buttons.default', edges: { top: '6px' } },
      { scope: 'variant', targetId: 'buttons.default', variantId: 'primary', edges: { top: '7px' } },
      { scope: 'state', targetId: 'buttons.default', variantId: 'primary', stateId: 'disabled', edges: { top: 0 } },
    )
    const resolved = resolvePadding(state, registry, { ...target, variantId: 'primary', stateId: 'disabled' })
    expect(resolved.edges.top).toMatchObject({ value: '0', source: 'state', explicit: true, native: false })
    expect(resolved.edges.right).toMatchObject({ value: '2px', source: 'global' })
  })

  it('uses native fallback and never mutates canonical padding', () => {
    const state = stateWith({ scope: 'global', edges: { top: 0 } })
    const before = structuredClone(state.padding)
    const resolved = resolvePadding(state, registry, target)
    expect(resolved.edges.top.value).toBe('0')
    expect(resolved.edges.right).toMatchObject({ value: null, source: 'native', native: true })
    expect(state.padding).toEqual(before)
  })

  it('reads explicit edges for the selected context without inherited copies', () => {
    const state = stateWith(
      { scope: 'global', edges: { top: '1px' } },
      { scope: 'component', targetId: 'buttons.default', edges: { right: '2px' } },
    )
    const result = readPadding(state, registry, { ...target, selectedContext: { scope: 'component', targetId: 'buttons.default' } })
    expect(result.explicitEdges).toEqual(['right'])
    expect(result.resolved.edges.top.source).toBe('global')
  })

  it('rejects unsupported targets and unsafe values', () => {
    expect(() => resolvePadding(stateWith(), registry, { targetId: 'forms.multiselect' })).toThrow()
    expect(() => resolvePadding(stateWith({ scope: 'global', edges: { top: 'calc(1px)' } }), registry, target)).toThrow()
  })

  it('skips inherited scopes for containers and rejects duplicate or nonfinite records', () => {
    const state = stateWith(
      { scope: 'global', edges: { top: '1px' } },
      { scope: 'section', sectionId: 'forms', edges: { top: '2px' } },
    )
    expect(resolvePadding(state, registry, { targetId: 'forms.section' }).edges.top).toMatchObject({ source: 'native' })
    expect(() => resolvePadding({ ...state, padding: [{ scope: 'global', edges: { top: '1px' } }, { scope: 'global', edges: { top: '2px' } }] }, registry, target)).toThrow()
    expect(() => resolvePadding(stateWith({ scope: 'global', edges: { top: 'Infinitypx' } }), registry, target)).toThrow()
  })
})
