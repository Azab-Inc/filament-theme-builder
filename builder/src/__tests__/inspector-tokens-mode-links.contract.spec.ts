import { describe, expect, it } from 'vitest'
import { inspectorColumnSelectors, isInspectorTargetScope } from '@/utils/inspector-target-scope-validation'
import { hasUserTokenReference, parseUserTokenReference, validateUserTokenName } from '@/utils/user-token-validation'

describe('approved Inspector and named token contracts', () => {
  it('accepts only bounded positional columns and emits generic classes', () => {
    const scope = { kind: 'table-column' as const, columnIndex: 2, parts: ['header', 'body'] as const }
    expect(isInspectorTargetScope(scope)).toBe(true)
    expect(inspectorColumnSelectors(scope)).toEqual(['.fi-ta .fi-ta-header-cell:nth-child(2)', '.fi-ta .fi-ta-cell:nth-child(2)'])
    expect(isInspectorTargetScope({ kind: 'table-column', columnIndex: 33, parts: ['body'] })).toBe(false)
    expect(isInspectorTargetScope({ kind: 'table-column', columnIndex: 2, parts: ['header'], selector: '.customer.name' })).toBe(false)
  })

  it('rejects unbounded or malformed positional selectors and retains generic generated selectors', async () => {
    const { validateRawSelector } = await import('@/utils/raw-override-validation')
    expect(validateRawSelector('.fi-ta :is(.fi-ta-header-cell, .fi-ta-cell):nth-child(2)').valid).toBe(true)
    expect(validateRawSelector('.fi-ta :is(.fi-ta-header-cell, .fi-ta-cell):nth-child(33)').valid).toBe(false)
    expect(validateRawSelector('.fi-ta :is(.anything):nth-child(2)').valid).toBe(false)
    expect(validateRawSelector('.fi-ta-header-cell-customer.name').valid).toBe(false)
  })

  it('validates names and references without recursive token definitions', () => {
    expect(validateUserTokenName('secondary')).toBeNull()
    expect(validateUserTokenName('primary')).toMatch(/reserved/i)
    expect(validateUserTokenName('Bad Name')).toMatch(/lowercase/i)
    expect(parseUserTokenReference('user.palette.secondary.500')).toBe('user.palette.secondary.500')
    expect(parseUserTokenReference('user.color.secondary.500')).toBeNull()
    const tokens = { palettes: { secondary: { base: { light: '#123456' }, shades: {} } }, colors: {} } as never
    expect(hasUserTokenReference(tokens, 'user.palette.secondary.500')).toBe(true)
    expect(hasUserTokenReference(tokens, 'user.color.missing')).toBe(false)
  })
})
