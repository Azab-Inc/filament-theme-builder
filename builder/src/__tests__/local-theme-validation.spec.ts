import { describe, expect, it } from 'vitest'
import type { ThemeStateV4 } from '@/models/theme.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { isSafeLocalThemeId, parseLocalThemeCollection, parseLocalThemeHistory } from '@/utils/local-theme-validation'

const state = createDefaultThemeState()
const validateState = (value: unknown): ThemeStateV4 | null => value === state ? state : null
const validRecord = { id: 'theme_01-a', name: 'Warm theme', updatedAt: 1_760_000_000_000 }

describe('local theme validation', () => {
  it('accepts stable safe IDs and rejects separators and control characters', () => {
    expect(isSafeLocalThemeId('theme_01-a')).toBe(true)
    for (const id of ['', '../theme', 'theme/name', 'theme:name', 'theme\\name', 'theme\nname']) {
      expect(isSafeLocalThemeId(id)).toBe(false)
    }
    expect(isSafeLocalThemeId(42)).toBe(false)
  })

  it('preserves valid collection record values', () => {
    expect(parseLocalThemeCollection([validRecord])).toEqual([validRecord])
  })

  it.each([
    [[validRecord, validRecord]],
    [[{ ...validRecord, id: '../unsafe' }]],
    [[{ ...validRecord, name: '  ' }]],
    [[{ ...validRecord, name: 4 }]],
    [[{ ...validRecord, updatedAt: Number.NaN }]],
    [[{ id: validRecord.id, name: validRecord.name }]],
    [null],
  ])('rejects malformed collection %j', (collection) => {
    expect(parseLocalThemeCollection(collection)).toBeNull()
  })

  it('accepts valid history snapshots and cursor', () => {
    expect(parseLocalThemeHistory({ snapshots: [state], cursor: 0 }, validateState))
      .toEqual({ snapshots: [state], cursor: 0 })
  })

  it.each([
    [{ snapshots: [], cursor: 0 }],
    [{ snapshots: [null], cursor: 0 }],
    [{ snapshots: [state], cursor: -1 }],
    [{ snapshots: [state], cursor: 1 }],
    [{ snapshots: [state], cursor: 0.5 }],
  ])('rejects invalid history %j', (history) => {
    expect(parseLocalThemeHistory(history, validateState)).toBeNull()
  })
})
