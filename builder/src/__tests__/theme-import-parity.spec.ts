import { describe, expect, it } from 'vitest'

import { createThemeRegistry } from '@/registry/theme-registry'
import { migrateThemeState, type ThemeState } from '@/models/theme.model'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'
import { migrateToCurrent } from '@/utils/theme-store-normalization'
import { deserializeTheme } from '@/utils/theme-serialization'

const registry = createThemeRegistry()
const v4 = createDefaultThemeState()
const { rawOverrides: _rawOverrides, ...v3 } = v4
const sources: ThemeState[] = [
  { schemaVersion: 1, colors: { primary: '#123456' } },
  { schemaVersion: 2, colors: { primary: '#123456' }, overrides: [] },
  { ...v3, schemaVersion: 3 },
  v4,
]

describe('authoritative migration parity', () => {
  it.each(sources)('keeps model, import, deserializer, and normalized legacy state equivalent for v%s', (source) => {
    const imported = migrateVersionedTheme(source, registry)
    const deserialized = deserializeTheme(source, registry)
    expect(imported.ok).toBe(true)
    expect(deserialized).toMatchObject({ valid: true })
    expect(imported.ok && migrateThemeState(source)).toEqual(imported.ok && imported.state)
    expect(imported.ok && migrateToCurrent(source)).toEqual(imported.ok && migrateToCurrent(imported.state))
    expect(deserialized.valid && migrateToCurrent(deserialized.state)).toEqual(imported.ok && migrateToCurrent(imported.state))
  })
})
