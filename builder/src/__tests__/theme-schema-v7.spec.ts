import { describe, expect, it } from 'vitest'
import { createDefaultCurrentThemeState } from '@/utils/foundation-defaults'
import { isThemeStateV7, migrateThemeToV7 } from '@/utils/theme-schema-v7'

describe('schema 7 canonical extension', () => {
  it('migrates schema 6 without changing existing values', () => {
    const state = createDefaultCurrentThemeState()
    const result = migrateThemeToV7(state as unknown as Omit<typeof state, 'schemaVersion'> & { schemaVersion: 6 })
    expect(result.schemaVersion).toBe(7)
    expect(result.modeLinks).toEqual({})
    expect(result.colors).toEqual(state.colors)
    expect(isThemeStateV7(result)).toBe(true)
  })
})
