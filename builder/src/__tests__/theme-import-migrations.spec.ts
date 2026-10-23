import { describe, expect, it } from 'vitest'

import { createThemeRegistry } from '@/registry/theme-registry'
import { createDefaultThemeState } from '@/utils/foundation-defaults'
import { migrateThemeState } from '@/models/theme.model'
import { migrateVersionedTheme } from '@/utils/theme-import-migrations'
import { validateLocalThemeState } from '@/utils/local-theme-storage'

const registry = createThemeRegistry()

describe('versioned theme migration edges', () => {
  it('migrates V1 through each explicit edge', () => {
    const result = migrateVersionedTheme({ schemaVersion: 1, colors: { primary: '#123456' } }, registry)
    expect(result).toMatchObject({ ok: true, sourceVersion: 1, migrationPath: [1, 2, 3, 4, 5] })
    expect(result.ok && result.state.schemaVersion).toBe(5)
    if (!result.ok) return
    expect(validateLocalThemeState(result.state)).not.toBeNull()
    expect(result.state.colors.primary).toBe('#123456')
    expect(result.state.foundations.palettes.primary.base).toBe('#123456')
    expect(result.state.foundations.palettes.primary.shades[500]).toBe('#123456')
  })

  it('migrates V2 through V3 and V4', () => {
    const result = migrateVersionedTheme({ schemaVersion: 2, colors: { primary: '#123456' }, overrides: [] }, registry)
    expect(result).toMatchObject({ ok: true, sourceVersion: 2, migrationPath: [2, 3, 4, 5] })
    expect(result.ok && result.state.colors.primary).toBe('#123456')
    expect(result.ok && result.state.foundations.palettes.primary.shades[500]).toBe('#123456')
  })

  it('migrates V3 to V4 while preserving canonical fields', () => {
    const v4 = createDefaultThemeState()
    const { rawOverrides: _rawOverrides, ...v3 } = v4
    const result = migrateVersionedTheme({ ...v3, schemaVersion: 3 }, registry)
    expect(result).toMatchObject({ ok: true, sourceVersion: 3, migrationPath: [3, 4, 5] })
    expect(result.ok && result.state.rawOverrides).toEqual([])
    expect(result.ok && result.state.customCss).toBe('')
  })

  it('clones V4 and does not mutate the source', () => {
    const source = createDefaultThemeState()
    const result = migrateVersionedTheme(source, registry)
    if (result.ok) result.state.colors.primary = '#123456'
    expect(source.colors.primary).not.toBe('#123456')
    expect(result.ok && result.migrationPath).toEqual([4, 5])
  })

  it('reports invalid migration input instead of stripping fields', () => {
    expect(migrateVersionedTheme({ ...createDefaultThemeState(), unexpected: true } as never, registry)).toMatchObject({ ok: false, category: 'invalid_theme_state' })
  })

  it('returns typed custom CSS and migration failures', () => {
    expect(migrateVersionedTheme({ ...createDefaultThemeState(), customCss: '.x{}' }, registry)).toMatchObject({ ok: false, category: 'nonempty_custom_css_rejected' })
    expect(migrateVersionedTheme({ schemaVersion: 2, colors: { primary: '#123456' }, overrides: [() => undefined] } as never, registry)).toMatchObject({ ok: false, category: 'migration_failed' })
  })

  it('rejects invalid model migration input with the default registry', () => {
    expect(() => migrateThemeState({ schemaVersion: 1, colors: { primary: 'not-a-color' } })).toThrow(/invalid_theme_state/i)
  })
})
