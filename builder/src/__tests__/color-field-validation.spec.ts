import { describe, expect, it } from 'vitest'
import { isColorFieldValueValid } from '@/utils/color-field-validation'

describe('color field validation profiles', () => {
  it('uses exact hex6 and hex68 profiles without admitting shorthand', () => {
    expect(isColorFieldValueValid('#abc', 'hex6')).toBe(false)
    expect(isColorFieldValueValid('#abcd', 'hex6')).toBe(false)
    expect(isColorFieldValueValid('#abcdef', 'hex6')).toBe(true)
    expect(isColorFieldValueValid('#abcdef12', 'hex6')).toBe(false)
    expect(isColorFieldValueValid('#abc', 'hex68')).toBe(false)
    expect(isColorFieldValueValid('#abcd', 'hex68')).toBe(false)
    expect(isColorFieldValueValid('#abcdef', 'hex68')).toBe(true)
    expect(isColorFieldValueValid('#abcdef12', 'hex68')).toBe(true)
    expect(isColorFieldValueValid('#abcdef123', 'hex68')).toBe(false)
  })

  it('allows trusted references in foundation and existing safe values for raw color properties', () => {
    expect(isColorFieldValueValid('#abc', 'foundation')).toBe(false)
    expect(isColorFieldValueValid('#abcd', 'foundation')).toBe(false)
    expect(isColorFieldValueValid('#abcdef', 'foundation')).toBe(true)
    expect(isColorFieldValueValid('#abcdef12', 'foundation')).toBe(true)
    expect(isColorFieldValueValid('var(--gray-900)', 'foundation')).toBe(true)
    expect(isColorFieldValueValid('var(--not-trusted)', 'foundation')).toBe(false)
    expect(isColorFieldValueValid('#abc', 'raw', 'color')).toBe(true)
    expect(isColorFieldValueValid('#abcd', 'raw', 'color')).toBe(true)
    expect(isColorFieldValueValid('#abcdef', 'raw', 'color')).toBe(true)
    expect(isColorFieldValueValid('#abcdef12', 'raw', 'color')).toBe(true)
    expect(isColorFieldValueValid('rgb(1 2 3)', 'raw', 'color')).toBe(true)
    expect(isColorFieldValueValid('var(--color-gray-900)', 'raw', 'color')).toBe(true)
    expect(isColorFieldValueValid('url(evil)', 'raw', 'color')).toBe(false)
  })
})
