import { describe, expect, it } from 'vitest'

import { createThemeRegistry } from '@/registry/theme-registry'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'

const registry = createThemeRegistry()

describe('versioned theme migration edges', () => {
  it('migrates V1 through each explicit edge', () => {
    const result = migrateVersionedTheme({ schemaVersion: 1, colors: { primary: '#123456' } }, registry)
    expect(result).toMatchObject({ sourceVersion: 1, migrationPath: [1, 2, 3, 4] })
    expect(result.state.schemaVersion).toBe(4)
  })

  it('migrates V2 through V3 and V4', () => {
    const result = migrateVersionedTheme({ schemaVersion: 2, colors: { primary: '#123456' }, overrides: [] }, registry)
    expect(result).toMatchObject({ sourceVersion: 2, migrationPath: [2, 3, 4] })
    expect(result.state.colors.primary).toBe('#123456')
  })

  it('migrates V3 to V4 while preserving canonical fields', () => {
    const v4 = createDefaultThemeState()
    const { rawOverrides: _rawOverrides, ...v3 } = v4
    const result = migrateVersionedTheme({ ...v3, schemaVersion: 3 }, registry)
    expect(result).toMatchObject({ sourceVersion: 3, migrationPath: [3, 4] })
    expect(result.state.rawOverrides).toEqual([])
    expect(result.state.customCss).toBe('')
  })

  it('clones V4 and does not mutate the source', () => {
    const source = createDefaultThemeState()
    const result = migrateVersionedTheme(source, registry)
    result.state.colors.primary = '#123456'
    expect(source.colors.primary).not.toBe('#123456')
    expect(result.migrationPath).toEqual([4])
  })

  it('reports invalid migration input instead of stripping fields', () => {
    expect(() => migrateVersionedTheme({ ...createDefaultThemeState(), unexpected: true } as never, registry)).toThrow(/unknown|invalid/i)
  })
})
