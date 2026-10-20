import { describe, expect, it } from 'vitest'
import { isColorFieldValueValid } from '@/utils/color-field-validation'

describe('color field validation profiles', () => {
  it('limits primary and palette fields to their accepted literal hex widths', () => {
    expect(isColorFieldValueValid('#abc', 'primary')).toBe(false)
    expect(isColorFieldValueValid('#abcdef', 'primary')).toBe(true)
    expect(isColorFieldValueValid('#abcdef12', 'palette')).toBe(true)
    expect(isColorFieldValueValid('#abcd', 'palette')).toBe(false)
  })

  it('allows trusted references in foundation and existing safe values for raw color properties', () => {
    expect(isColorFieldValueValid('var(--gray-900)', 'foundation')).toBe(true)
    expect(isColorFieldValueValid('var(--not-trusted)', 'foundation')).toBe(false)
    expect(isColorFieldValueValid('rgb(1 2 3)', 'raw', 'color')).toBe(true)
    expect(isColorFieldValueValid('url(evil)', 'raw', 'color')).toBe(false)
  })
})
