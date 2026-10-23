import { describe, expect, it } from 'vitest'

import type { PaddingRecord } from '@/models/padding.model'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { resolvePadding, readPadding } from '@/utils/padding-resolver'
import { validatePaddingMutation, validatePaddingValue } from '@/utils/padding-validation'
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

  it('rejects unknown request and operation fields and duplicate reset edges', () => {
    expect(() => resolvePadding(stateWith(), registry, { ...target, extra: true } as never)).toThrow()
    expect(validatePaddingMutation({ operation: 'set', context: { scope: 'global' }, edges: { top: '1px' }, resetEdges: ['right'] } as never, stateWith(), registry).valid).toBe(false)
    expect(validatePaddingMutation({ operation: 'reset', context: { scope: 'global' }, resetEdges: ['top', 'top'] }, stateWith(), registry).valid).toBe(false)
    expect(validatePaddingMutation({ operation: 'wat', context: { scope: 'global' } } as never, stateWith(), registry).valid).toBe(false)
  })

  it('accepts the twelve anchored units and canonical zero forms only', () => {
    for (const unit of ['px', 'rem', 'em', 'ex', 'ch', 'lh', 'rlh', 'vw', 'vh', 'vmin', 'vmax', '%']) expect(validatePaddingValue(`1${unit}`, ['px', 'rem', 'em', 'ex', 'ch', 'lh', 'rlh', 'vw', 'vh', 'vmin', 'vmax', '%'], 'value').valid).toBe(true)
    expect(validatePaddingValue(0, ['px'], 'value').valid).toBe(true)
    expect(validatePaddingValue('0', ['px'], 'value').valid).toBe(true)
    expect(validatePaddingValue('0px', ['px'], 'value').valid).toBe(true)
    for (const value of ['1e3px', '0x10px', ' 1px', '-1px', 'calc(1px)', 'var(--x)']) expect(validatePaddingValue(value, ['px'], 'value').valid).toBe(false)
    for (const value of ['10000px', `${'1'.repeat(301)}px`, '1.2rlh', '9999px']) expect(validatePaddingValue(value, ['px', 'rlh'], 'value').valid).toBe(value === '9999px' || value === '1.2rlh')
  })

  it('keeps record edges separate from strict public contexts', () => {
    const context = { scope: 'global', edges: { top: '1px' } } as const
    expect(validatePaddingMutation({ operation: 'set', context, edges: { right: '2px' } }, stateWith(), registry).valid).toBe(false)
    expect(() => readPadding(stateWith(), registry, { ...target, selectedContext: context as never })).toThrow()
    expect(resolvePadding(stateWith({ scope: 'global', edges: { top: '1px' } }), registry, target).edges.top.value).toBe('1px')
    for (const key of ['constructor', 'prototype', 'unknown']) {
      expect(validatePaddingMutation({ operation: 'set', context: { scope: 'global', [key]: true }, edges: { top: '1px' } }, stateWith(), registry).valid).toBe(false)
    }
  })

  it('matches contexts independent of object key order and reports local provenance', () => {
    const parent = { scope: 'section', sectionId: 'forms', edges: { top: '1px' } } as const
    const state = stateWith(parent, { edges: { top: 0 }, targetId: 'forms.input', scope: 'component' })
    const result = readPadding(state, registry, { targetId: 'forms.input', selectedContext: { targetId: 'forms.input', scope: 'component' } })
    expect(result.explicitEdges).toEqual(['top'])
    expect(result.resolved.edges.top).toMatchObject({ source: 'component', explicit: true, value: '0' })
    expect(() => resolvePadding({ ...state, padding: [parent, { sectionId: 'forms', scope: 'section', edges: { top: '2px' } }] }, registry, target)).toThrow()
  })
})
